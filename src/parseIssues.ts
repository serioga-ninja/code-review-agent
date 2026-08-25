// src/parseIssues.ts
import type { ReviewIssue } from "./reviewer.js";

export function parseIssuesResponse(text: string): ReviewIssue[] {
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.issues)) {
      throw new Error("Response JSON is missing an 'issues' array");
    }
    return parsed.issues;
  } catch (err) {
    throw new Error(
      `Failed to parse model response as JSON: ${(err as Error).message}\nRaw response: ${cleaned.slice(0, 200)}...`,
    );
  }
}
