import { octokit } from "../github/github_client.js";
import { mapGitHubError } from "../github/errorMap.js";
import { AddCommentToIssueOutputSchema } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

export const ADD_COMMENT_TOOL_NAME = "add-comment-to-issue";
export const ADD_COMMENT_TOOL_DESCRIPTION =
    "Add a comment to an existing issue in a GitHub repository. " +
    "Returns the created comment's ID, HTML URL, body, and author.";

// ═══ Handler ════════════════════════════════════════════════════════

export async function addCommentToIssueHandler(args: { owner: string; repo: string; issue_number: number; body: string }) {
    try {
        const { data } = await octokit.issues.createComment({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issue_number,
            body: args.body,
        });

        const result = AddCommentToIssueOutputSchema.safeParse(data);
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
