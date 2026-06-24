import { octokit } from "../github/github_client.js";
import { mapGitHubError } from "../github/errorMap.js";
import { CloseIssueOutputSchema } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

export const CLOSE_ISSUE_TOOL_NAME = "close-issue";
export const CLOSE_ISSUE_TOOL_DESCRIPTION =
    "Close an existing issue in a GitHub repository. " +
    "Returns the updated issue details, verifying its state is 'closed'.";

// ═══ Handler ════════════════════════════════════════════════════════

export async function closeIssueHandler(args: { owner: string; repo: string; issue_number: number }) {
    try {
        const { data } = await octokit.issues.update({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issue_number,
            state: "closed",
        });

        const result = CloseIssueOutputSchema.safeParse(data);
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
            content: [{ type: "text" as const, text: JSON.stringify(mapGitHubError(error, { owner: args.owner, repo: args.repo, issue_number: args.issue_number }), null, 2) }],
            isError: true
        };
    }
}
