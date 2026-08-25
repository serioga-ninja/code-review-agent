#!/usr/bin/env node
import { Command } from "commander";
import { getDiff, getChangedFiles } from "./git.js";
import { reviewDiff } from "./reviewer.js";
import { loadConfig } from "./config.js";

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

      const issues = await reviewDiff(diff, config);

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
