import { z } from "zod";
import { octokit } from "../client/github-client.js";

// ─── Input: what the LLM sends to invoke this tool ──────────────────
export const GetRepoInputShape = {
  owner: z.string().min(1).describe("GitHub username or org (e.g. 'facebook')."),
  repo: z.string().min(1).describe("Repository name (e.g. 'react')."),
};

// ─── Output: Zod contract that cherry-picks & cleans the API response
const RepoOutputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().transform((v) => v ?? "(no description)"),
  html_url: z.string().url(),
  stargazers_count: z.number(),
  open_issues_count: z.number(),
  owner: z.object({
    login: z.string(),
    html_url: z.string().url(),
    type: z.string(),
  }),
  created_at: z.string().nullable().transform((v) => v ?? "(unknown)"),
  updated_at: z.string().nullable().transform((v) => v ?? "(unknown)"),
  pushed_at: z.string().nullable().transform((v) => v ?? "(unknown)"),
});

// ─── Tool Metadata ──────────────────────────────────────────────────
export const GET_REPO_TOOL_NAME = "get-repo";

export const GET_REPO_TOOL_DESCRIPTION =
  "Fetch key details about a GitHub repository: name, description, URL, " +
  "stars, open issues, owner, and timestamps.";

// ─── Handler: fetch, parse through Zod, return structured result ────
export async function getRepoHandler(args: { owner: string; repo: string }) {
  try {
    const { data } = await octokit.repos.get({ owner: args.owner, repo: args.repo });

    // Zod strips unneeded fields and coalesces nulls in one pass
    const parsed = RepoOutputSchema.parse(data);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(parsed, null, 2) }],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [{ type: "text" as const, text: `Error: ${args.owner}/${args.repo}: ${message}` }],
      isError: true,
    };
  }
}
