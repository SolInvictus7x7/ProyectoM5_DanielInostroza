#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { LIST_REPO_TOOL_NAME, LIST_REPO_TOOL_DESCRIPTION, listRepoHandler } from "./tools/list_repo.js";
import { LIST_ISSUES_TOOL_NAME, LIST_ISSUES_TOOL_DESCRIPTION, listIssuesHandler } from "./tools/list_issues.js";
import { CREATE_REPO_TOOL_NAME, CREATE_REPO_TOOL_DESCRIPTION, createRepoHandler } from "./tools/create_repo.js";
import { CREATE_ISSUE_TOOL_NAME, CREATE_ISSUE_TOOL_DESCRIPTION, createIssueHandler } from "./tools/create_issue.js";
import { CREATE_COMMIT_TOOL_NAME, CREATE_COMMIT_TOOL_DESCRIPTION, createCommitHandler } from "./tools/create_commit.js";
import { ListRepoInputShape, ListIssuesInputShape, CreateRepoInputShape, CreateIssueInputShape, CreateCommitInputShape } from "./schemas/index.js";

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

// Register create-repo: creates a new repository for the authenticated user
server.tool(
  CREATE_REPO_TOOL_NAME,
  CREATE_REPO_TOOL_DESCRIPTION,
  CreateRepoInputShape,
  createRepoHandler
);

// Register create-issue: creates a new issue in a specific repo
server.tool(
  CREATE_ISSUE_TOOL_NAME,
  CREATE_ISSUE_TOOL_DESCRIPTION,
  CreateIssueInputShape,
  createIssueHandler
);

// Register create-commit: creates a commit with files directly via the Git API
server.tool(
  CREATE_COMMIT_TOOL_NAME,
  CREATE_COMMIT_TOOL_DESCRIPTION,
  CreateCommitInputShape,
  createCommitHandler
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
