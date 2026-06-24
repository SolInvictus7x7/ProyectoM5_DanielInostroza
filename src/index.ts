#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { LIST_REPO_TOOL_NAME, LIST_REPO_TOOL_DESCRIPTION, listRepoHandler } from "./tools/list_repo.js";
import { LIST_ISSUES_TOOL_NAME, LIST_ISSUES_TOOL_DESCRIPTION, listIssuesHandler } from "./tools/list_issues.js";
import { CREATE_REPO_TOOL_NAME, CREATE_REPO_TOOL_DESCRIPTION, createRepoHandler } from "./tools/create_repo.js";
import { CREATE_ISSUE_TOOL_NAME, CREATE_ISSUE_TOOL_DESCRIPTION, createIssueHandler } from "./tools/create_issue.js";
import { CREATE_COMMIT_TOOL_NAME, CREATE_COMMIT_TOOL_DESCRIPTION, createCommitHandler } from "./tools/create_commit.js";
import { LIST_COMMITS_TOOL_NAME, LIST_COMMITS_TOOL_DESCRIPTION, listCommitsHandler } from "./tools/list_commits.js";
import { ADD_COMMENT_TOOL_NAME, ADD_COMMENT_TOOL_DESCRIPTION, addCommentToIssueHandler } from "./tools/add_comment_to_issue.js";
import { CLOSE_ISSUE_TOOL_NAME, CLOSE_ISSUE_TOOL_DESCRIPTION, closeIssueHandler } from "./tools/close_issue.js";

import {
  ListRepoInputShape,
  ListIssuesInputShape,
  CreateRepoInputShape,
  CreateIssueInputShape,
  CreateCommitInputShape,
  ListCommitsInputShape,
  AddCommentToIssueInputShape,
  CloseIssueInputShape,
} from "./schemas/index.js";

// ─── Create the MCP Server ─────────────────────────────────────────

const server = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
});

// ─── Register Tools ─────────────────────────────────────────────────

server.registerTool(
  LIST_REPO_TOOL_NAME,
  {
    description: LIST_REPO_TOOL_DESCRIPTION,
    inputSchema: ListRepoInputShape,
  },
  listRepoHandler
);

server.registerTool(
  LIST_ISSUES_TOOL_NAME,
  {
    description: LIST_ISSUES_TOOL_DESCRIPTION,
    inputSchema: ListIssuesInputShape,
  },
  listIssuesHandler
);

server.registerTool(
  CREATE_REPO_TOOL_NAME,
  {
    description: CREATE_REPO_TOOL_DESCRIPTION,
    inputSchema: CreateRepoInputShape,
  },
  createRepoHandler
);

server.registerTool(
  CREATE_ISSUE_TOOL_NAME,
  {
    description: CREATE_ISSUE_TOOL_DESCRIPTION,
    inputSchema: CreateIssueInputShape,
  },
  createIssueHandler
);

server.registerTool(
  CREATE_COMMIT_TOOL_NAME,
  {
    description: CREATE_COMMIT_TOOL_DESCRIPTION,
    inputSchema: CreateCommitInputShape,
  },
  createCommitHandler
);

server.registerTool(
  LIST_COMMITS_TOOL_NAME,
  {
    description: LIST_COMMITS_TOOL_DESCRIPTION,
    inputSchema: ListCommitsInputShape,
  },
  listCommitsHandler
);

server.registerTool(
  ADD_COMMENT_TOOL_NAME,
  {
    description: ADD_COMMENT_TOOL_DESCRIPTION,
    inputSchema: AddCommentToIssueInputShape,
  },
  addCommentToIssueHandler
);

server.registerTool(
  CLOSE_ISSUE_TOOL_NAME,
  {
    description: CLOSE_ISSUE_TOOL_DESCRIPTION,
    inputSchema: CloseIssueInputShape,
  },
  closeIssueHandler
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
