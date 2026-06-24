import { octokit } from "../github/github_client.js";
import { mapGitHubError } from "../github/errorMap.js";
import { ListRepoOutputSchema } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

// Tool metadata — tells the agent what this tool does and what fields it returns
export const LIST_REPO_TOOL_NAME = "list-repo";
export const LIST_REPO_TOOL_DESCRIPTION =
  "List repositories for the authenticated GitHub user, including private ones. Returns JSON array with: " +
  "name (string), description (string), html_url (string), " +
  "stargazers_count (number), fork (boolean), language (string), " +
  "updated_at (ISO timestamp).";

// ═══ Handler ════════════════════════════════════════════════════════

// Fetches all repos for the authenticated user, validates through the output contract, returns JSON
export async function listRepoHandler(_args: unknown) {
  try {
    // Call the Octokit wrapper to list repos for the authenticated user
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 30,
    });

    // Map through the output schema — validates, strips, and transforms in one step
    const parsed = ListRepoOutputSchema.parse(data);
    return { content: [{ type: "text" as const, text: JSON.stringify(parsed, null, 2) }] };
  } catch (error: unknown) {
    // Route all errors through the centralized mapper
    const mapped = mapGitHubError(error, {});
    return {
      content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
      isError: true,
    };
  }
}
