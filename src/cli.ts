#!/usr/bin/env node
import { Command } from "commander";
import { getDiff, getChangedFiles } from "./git";

const program = new Command();

program
  .name("review")
  .description("AI-агент для архітектурного рев'ю коду")
  .action(async () => {
    try {
      const diff = await getDiff();
      const files = await getChangedFiles();

      console.log(`Знайдено змін у ${files.length} файлах:`);
      files.forEach((f) => console.log(`  - ${f}`));
      console.log("\n--- Diff (перевірка) ---\n");
      console.log(diff.slice(0, 500) + "...");

      // тут далі підключимо виклик Claude API
    } catch (err) {
      console.error("Помилка:", (err as Error).message);
      process.exit(1);
    }
  });

program.parse();
