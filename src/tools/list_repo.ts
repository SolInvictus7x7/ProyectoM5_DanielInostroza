import { octokit } from "../github/github-client.js";
import { mapGitHubError } from "../github/errorMap.js";
import { ListRepoOutputSchema } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

// Tool metadata — tells the agent what this tool does and what fields it returns
export const LIST_REPO_TOOL_NAME = "list-repo";
export const LIST_REPO_TOOL_DESCRIPTION =
  "List public repositories for a GitHub user. Returns JSON array with: " +
  "name (string), description (string), html_url (string), " +
  "stargazers_count (number), fork (boolean), language (string), " +
  "updated_at (ISO timestamp).";

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
