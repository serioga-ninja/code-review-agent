#!/usr/bin/env node
import { Command } from "commander";
import { getDiff, getChangedFiles } from "./git.js";
import { reviewDiff, type ReviewIssue } from "./reviewer.js";
import { loadConfig } from "./config.js";
import { checkDiffSize, splitDiffByFile } from "./diffSize.js";

const program = new Command();

program
  .name("review")
  .description("AI agent for architectural code review")
  .action(async () => {
    try {
      const config = loadConfig();
      const diff = await getDiff();
      const files = await getChangedFiles();

      console.log(`Analyzing changes in ${files.length} file(s)...\n`);
      const { safe, charCount } = checkDiffSize(diff);
      let issues: ReviewIssue[];

      if (safe) {
        issues = await reviewDiff(diff, config);
      } else {
        console.log(`Diff is large (${charCount} chars), splitting by file...\n`);
        const chunks = splitDiffByFile(diff);
        issues = [];
        for (const chunk of chunks) {
          const chunkIssues = await reviewDiff(chunk, config);
          issues.push(...chunkIssues);
        }
      }

      if (issues.length === 0) {
        console.log("✅ No architectural issues found.");
      } else {
        issues.forEach((issue) => {
          const icon =
            issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "🔵";
          console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.file}`);
          console.log(`   ${issue.description}`);
          console.log(`   → ${issue.suggestion}\n`);
        });
      }
    } catch (err) {
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

program.parse();
