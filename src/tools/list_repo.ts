import { z } from "zod";
import { octokit } from "../github/github-client.js";
import { mapGitHubError } from "../github/errorMap.js";

// ═══ Contract ═══════════════════════════════════════════════════════

// Tool metadata — tells the agent what this tool does and what fields it returns
export const LIST_REPO_TOOL_NAME = "list-repo";
export const LIST_REPO_TOOL_DESCRIPTION =
  "List public repositories for a GitHub user. Returns JSON array with: " +
  "name (string), description (string), html_url (string), " +
  "stargazers_count (number), fork (boolean), language (string), " +
  "updated_at (ISO timestamp).";

// Input schema — only a username is needed to list repos
export const ListRepoInputShape = {
  username: z.string().min(1).describe("GitHub username whose repos to list (e.g. 'octocat')."),
};

// Output schema — one item per repository; .parse() validates AND strips extra fields
const RepoItemSchema = z.object({
  name: z.string().describe("Repository name."),
  description: z.string().nullable().transform((v) => v ?? "(no description)").describe("Repo summary."),
  html_url: z.string().url().describe("Browser URL."),
  stargazers_count: z.number().describe("Star count."),
  fork: z.boolean().describe("Whether the repo is a fork."),
  language: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Primary language."),
  updated_at: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Last update timestamp."),
});

// The full output is an array of repo items
export const ListRepoOutputSchema = z.array(RepoItemSchema);

// ═══ Handler ════════════════════════════════════════════════════════

// Fetches all public repos for a user, validates through the output contract, returns JSON
export async function listRepoHandler(args: { username: string }) {
  try {
    // Call the Octokit wrapper to list repos for the given username
    const { data } = await octokit.repos.listForUser({
      username: args.username,
      type: "owner",
      sort: "updated",
      per_page: 30,
    });

    // Map through the output schema — validates, strips, and transforms in one step
    const parsed = ListRepoOutputSchema.parse(data);
    return { content: [{ type: "text" as const, text: JSON.stringify(parsed, null, 2) }] };
  } catch (error: unknown) {
    // Route all errors through the centralized mapper
    const mapped = mapGitHubError(error, { username: args.username });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
      isError: true,
    };
  }
}
