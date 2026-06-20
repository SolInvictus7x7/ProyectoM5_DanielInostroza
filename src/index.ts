#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { GET_REPO_TOOL_NAME, GET_REPO_TOOL_DESCRIPTION, GetRepoInputShape, getRepoHandler } from "./tools/get-repo.js";

// ─── Create the MCP Server ─────────────────────────────────────────

const server = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
});

// ─── Register Tools ─────────────────────────────────────────────────

server.tool(
  GET_REPO_TOOL_NAME,
  GET_REPO_TOOL_DESCRIPTION,
  GetRepoInputShape,
  getRepoHandler
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
