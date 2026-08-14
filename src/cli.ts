#!/usr/bin/env node
import { Command } from "commander";
import { getChangedFiles, getDiff } from "./git.js";
import { reviewDiff } from "./reviewer.js";

const program = new Command();

program
  .name("review")
  .description("AI-агент для архітектурного рев'ю коду")
  .action(async () => {
    const diff = await getDiff();
    const files = await getChangedFiles();

    console.log(`Аналізую зміни у ${files.length} файлах...\n`);

    const issues = await reviewDiff(diff);

    if (issues.length === 0) {
      console.log("✅ Архітектурних проблем не знайдено.");
    } else {
      issues.forEach((issue, i) => {
        const icon =
          issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "🔵";
        console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.file}`);
        console.log(`   ${issue.description}`);
        console.log(`   → ${issue.suggestion}\n`);
      });
    }
  });

program.parse();
