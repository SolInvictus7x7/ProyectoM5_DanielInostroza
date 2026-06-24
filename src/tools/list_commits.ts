import { Octokit } from "@octokit/rest";
import { mapGitHubError } from "../github/errorMap.js";
import { ListCommitsOutputSchemaList } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

export const LIST_COMMITS_TOOL_NAME = "list-commits";
export const LIST_COMMITS_TOOL_DESCRIPTION =
    "List recent commits for a GitHub repository. " +
    "Returns an array of commits with their SHA, HTML URL, message, and author details.";

// ═══ Handler ════════════════════════════════════════════════════════

export function makelistCommitsHandler(deps: { octokit: Octokit }) {
    return async function listCommitsHandler(args: { owner: string; repo: string; per_page: number }) {
    try {
        const { data } = await deps.octokit.repos.listCommits({
            owner: args.owner,
            repo: args.repo,
            per_page: args.per_page,
        });

        const result = ListCommitsOutputSchemaList.safeParse(data);
        if (!result.success) {
            return {
                content: [{
                    type: "text" as const, text: JSON.stringify({
                        isError: true,
                        code: "ValidationError",
                        message: "Failed to validate GitHub API response structure.",
                        hint: "The data returned by GitHub might have changed.",
                        details: result.error.message,
                    }, null, 2)
                }],
                isError: true
            };
        }

        return {
            content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }]
        };

    } catch (error) {
        return {
            content: [{ type: "text" as const, text: JSON.stringify(mapGitHubError(error, { owner: args.owner, repo: args.repo }), null, 2) }],
            isError: true
        };
    }
}

}
