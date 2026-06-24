import { Octokit } from "@octokit/rest";
import { mapGitHubError } from "../github/errorMap.js";
import { ListRepoOutputSchema } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

export const LIST_REPO_TOOL_NAME = "list-repo";
export const LIST_REPO_TOOL_DESCRIPTION =
  "List repositories for the authenticated GitHub user, including private ones. Returns JSON array with: " +
  "name (string), description (string), html_url (string), " +
  "stargazers_count (number), fork (boolean), language (string), " +
  "updated_at (ISO timestamp).";

// ═══ Handler ════════════════════════════════════════════════════════

export function makelistRepoHandler(deps: { octokit: Octokit }) {
    return async function listRepoHandler(_args: unknown) {
  try {
    const { data } = await deps.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 30,
    });

        const result = ListRepoOutputSchema.safeParse(data);
        if (!result.success) {
            return {
                content: [{ type: "text" as const, text: JSON.stringify({
                    isError: true,
                    code: "SCHEMA_VALIDATION_ERROR",
                    message: "GitHub response did not match the expected repo list schema",
                    hint: "This may indicate a GitHub API change — report this to the tool maintainer",
                    details: result.error.message,
                }, null, 2) }],
                isError: true,
            };
        }
        return { content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }] };
  } catch (error: unknown) {
    const mapped = mapGitHubError(error, {});
    return {
      content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
      isError: true,
    };
  }
}

}
