import Anthropic from "@anthropic-ai/sdk";
import { ReviewConfig } from "./config.js";
import { parseIssuesResponse } from "./parseIssues.js";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export interface ReviewIssue {
  file: string;
  severity: "critical" | "warning" | "suggestion";
  description: string;
  suggestion: string;
}

function buildSystemPrompt(config: ReviewConfig): string {
  const ruleDescriptions: Record<keyof ReviewConfig["rules"], string> = {
    nPlusOne: "- N+1 database queries (especially Prisma/TypeORM)",
    transactions: "- Incorrect transaction usage (missing atomicity where needed)",
    missingIndexes: "- Missing indexes on frequently filtered/sorted fields",
    separationOfConcerns: "- Separation of concerns violations",
    scalability: "- Potential scalability issues",
    security: "- Unsafe patterns (SQL injection, missing input validation)",
  };

  const activeRules = Object.entries(config.rules)
    .filter(([, enabled]) => enabled)
    .map(([key]) => ruleDescriptions[key as keyof ReviewConfig["rules"]])
    .join("\n");

  return `You are a senior engineer performing an architectural code review.
Look ONLY for the following categories of issues:

${activeRules}

IMPORTANT: write all text fields (description, suggestion) in ${config.language}.
Keep technical terms (variable names, function names, pattern names like "N+1 query") untranslated.

For each issue found, return a JSON object in an "issues" array with fields:
file, severity ("critical"|"warning"|"suggestion"), description, suggestion.
If there are no issues, return {"issues": []}. Respond with JSON only.`;
}

async function callModel(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model did not return a text response");
  }
  return textBlock.text;
}

export async function reviewDiff(diff: string, config: ReviewConfig): Promise<ReviewIssue[]> {
  const systemPrompt = buildSystemPrompt(config);
  const userMessage = `Here is the git diff to review:\n\n${diff}`;

  const firstAttempt = await callModel(systemPrompt, userMessage);

  try {
    return parseIssuesResponse(firstAttempt);
  } catch {
    // one retry: ask the model to fix the format
    console.log("⚠️  Invalid response format, retrying once...");
    const retryMessage = `${userMessage}\n\nYour previous response was not valid JSON. Respond with ONLY a valid JSON object, no markdown formatting, no extra text.`;
    const secondAttempt = await callModel(systemPrompt, retryMessage);
    return parseIssuesResponse(secondAttempt); // if this throws too, let it propagate
  }
}
