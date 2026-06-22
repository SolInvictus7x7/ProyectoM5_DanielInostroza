#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { LIST_REPO_TOOL_NAME, LIST_REPO_TOOL_DESCRIPTION, ListRepoInputShape, listRepoHandler } from "./tools/list_repo.js";
import { LIST_ISSUES_TOOL_NAME, LIST_ISSUES_TOOL_DESCRIPTION, ListIssuesInputShape, listIssuesHandler } from "./tools/list_issues.js";

// ─── Create the MCP Server ─────────────────────────────────────────

const server = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
});

// ─── Register Tools ─────────────────────────────────────────────────

server.tool(
  LIST_REPO_TOOL_NAME,
  LIST_REPO_TOOL_DESCRIPTION,
  ListRepoInputShape,
  listRepoHandler
);

// Register list-issues: lists all open issues for a given owner/repo
server.tool(
  LIST_ISSUES_TOOL_NAME,
  LIST_ISSUES_TOOL_DESCRIPTION,
  ListIssuesInputShape,
  listIssuesHandler
);

// ─── Connect via stdio transport ────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
