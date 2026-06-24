import { octokit } from "../github/github_client.js";
import { mapGitHubError } from "../github/errorMap.js";
import { CreateIssueOutputSchema } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

export const CREATE_ISSUE_TOOL_NAME = "create-issue";
export const CREATE_ISSUE_TOOL_DESCRIPTION =
    "Create a new issue in a GitHub repository. " +
    "Returns a DTO with: number, title, state, html_url, body, user (login), labels (names), and assignees (logins).";

// ═══ Handler ════════════════════════════════════════════════════════

export async function createIssueHandler(args: { owner: string; repo: string; title: string; body?: string; labels?: string[]; assignees?: string[] }) {
    try {
        const { data } = await octokit.issues.create({
            owner: args.owner,
            repo: args.repo,
            title: args.title,
            body: args.body,
            labels: args.labels,
            assignees: args.assignees,
        });

        const result = CreateIssueOutputSchema.safeParse(data);
        if (!result.success) {
            return {
                content: [{
                    type: "text" as const, text: JSON.stringify({
                        isError: true,
                        code: "SCHEMA_VALIDATION_ERROR",
                        message: "GitHub response did not match the expected issue schema",
                        hint: "Make sure you are not sending invalid inputs",
                        details: result.error.message,
                    }, null, 2)
                }],
                isError: true,
            };
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: unknown) {
        const mapped = mapGitHubError(error, { owner: args.owner, repo: args.repo });
        return {
            content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
            isError: true,
        };
    }
}
