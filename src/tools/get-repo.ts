import { z } from "zod";
import { octokit } from "../github/github-client.js";
import { mapGitHubError } from "../github/errorMap.js";

// ═══ Contract ═══════════════════════════════════════════════════════

// What the agent reads to decide whether to call this tool and what to expect back
export const GET_REPO_TOOL_NAME = "get-repo";
export const GET_REPO_TOOL_DESCRIPTION =
  "Fetch a GitHub repository by owner and name. Returns JSON with: " +
  "name (string), description (string), html_url (string), " +
  "stargazers_count (number), open_issues_count (number), " +
  "owner { login, html_url, type }, " +
  "created_at, updated_at, pushed_at (ISO timestamps).";

// Input schema — what the agent must provide to call this tool
export const GetRepoInputShape = {
  owner: z.string().min(1).describe("GitHub username or org (e.g. 'facebook')."),
  repo: z.string().min(1).describe("Repository name (e.g. 'react')."),
};

// Output schema — validates the API response and strips it to only the contracted fields
export const RepoOutputSchema = z.object({
  name: z.string().describe("Repository name."),
  description: z.string().nullable().transform((v) => v ?? "(no description)").describe("Repo summary."),
  html_url: z.string().url().describe("Browser URL."),
  stargazers_count: z.number().describe("Star count."),
  open_issues_count: z.number().describe("Open issue count."),
  owner: z.object({
    login: z.string().describe("Owner username."),
    html_url: z.string().url().describe("Owner profile URL."),
    type: z.string().describe("User or Organization."),
  }).describe("Repository owner."),
  created_at: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Creation timestamp."),
  updated_at: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Last update timestamp."),
  pushed_at: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Last push timestamp."),
});

// ═══ Handler ════════════════════════════════════════════════════════

// Fetches the repo, parses through the output contract, returns structured JSON
export async function getRepoHandler(args: { owner: string; repo: string }) {
  try {
    const { data } = await octokit.repos.get({ owner: args.owner, repo: args.repo });
    const parsed = RepoOutputSchema.parse(data);
    return { content: [{ type: "text" as const, text: JSON.stringify(parsed, null, 2) }] };
  } catch (error: unknown) {
    // Route all errors through the centralized mapper
    const mapped = mapGitHubError(error, { owner: args.owner, repo: args.repo });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
      isError: true,
    };
  }
}
