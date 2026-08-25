import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getDiff, getChangedFiles } from "./git.js";
import { reviewDiff } from "./reviewer.js";
import { loadConfig } from "./config.js";
import { checkDiffSize, splitDiffByFile } from "./diffSize.js";

const server = new McpServer({
  name: "architectural-review-agent",
  version: "0.1.0",
});

server.registerTool(
  "review_current_changes",
  {
    title: "review_current_changes",
    description:
      "Performs an architectural code review of the current git diff (staged + unstaged changes) in the current working directory. Looks for N+1 queries, transaction issues, missing indexes, separation of concerns violations, scalability problems, and security issues.",
    inputSchema: {}, // no input params for now — always reviews cwd
  },
  async () => {
    const config = loadConfig();
    const diff = await getDiff();
    const files = await getChangedFiles();

    const { safe } = checkDiffSize(diff);
    const issues = safe
      ? await reviewDiff(diff, config)
      : (await Promise.all(splitDiffByFile(diff).map((chunk) => reviewDiff(chunk, config)))).flat();

    const summary =
      issues.length === 0
        ? `No architectural issues found across ${files.length} changed file(s).`
        : `Found ${issues.length} issue(s) across ${files.length} changed file(s):\n\n` +
          issues
            .map(
              (i) => `[${i.severity.toUpperCase()}] ${i.file}\n${i.description}\n→ ${i.suggestion}`,
            )
            .join("\n\n");

    return {
      content: [{ type: "text", text: summary }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
