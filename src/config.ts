import fs from "fs";
import path from "path";

export interface ReviewConfig {
  language: string;
  rules: {
    nPlusOne: boolean;
    transactions: boolean;
    missingIndexes: boolean;
    separationOfConcerns: boolean;
    scalability: boolean;
    security: boolean;
  };
}

const DEFAULT_CONFIG: ReviewConfig = {
  language: "ukrainian",
  rules: {
    nPlusOne: true,
    transactions: true,
    missingIndexes: true,
    separationOfConcerns: true,
    scalability: true,
    security: true,
  },
};

export function loadConfig(): ReviewConfig {
  const configPath = path.join(process.cwd(), ".reviewerrc.json");

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const userConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    rules: { ...DEFAULT_CONFIG.rules, ...userConfig.rules },
  };
}
