import Anthropic from "@anthropic-ai/sdk";
import { ReviewConfig } from "./config";

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

export async function reviewDiff(diff: string, config: ReviewConfig): Promise<ReviewIssue[]> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: buildSystemPrompt(config),
    messages: [{ role: "user", content: `Here is the git diff to review:\n\n${diff}` }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model did not return a text response");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed.issues ?? [];
}
