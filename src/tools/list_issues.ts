import { octokit } from "../github/github_client.js";
import { mapGitHubError } from "../github/errorMap.js";
import { CompactOutputSchemaList, DetailedOutputSchemaList } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

export const LIST_ISSUES_TOOL_NAME = "list-issues";
export const LIST_ISSUES_TOOL_DESCRIPTION =
    "List open issues for a GitHub repository. " +
    "By default returns a compact DTO per issue: number, title, state, html_url, user (login), labels (names only), assignees (logins only). " +
    "Set include_details=true to also get: body (markdown), label color/description, assignee profile URLs, milestone { title, state, due_on }, comments count, created_at, updated_at.";


// ═══ Handler ════════════════════════════════════════════════════════

export async function listIssuesHandler(args: { owner: string; repo: string; include_details: boolean }) {
    try {
        const { data } = await octokit.issues.listForRepo({
            owner: args.owner,
            repo: args.repo,
            state: "open",
            sort: "updated",
            direction: "desc",
            per_page: 30,
        });

        const issuesOnly = data.filter((item) => !item.pull_request);

        const schema = args.include_details ? DetailedOutputSchemaList : CompactOutputSchemaList;

        const result = schema.safeParse(issuesOnly);
        if (!result.success) {
            return {
                content: [{
                    type: "text" as const, text: JSON.stringify({
                        isError: true,
                        code: "SCHEMA_VALIDATION_ERROR",
                        message: "GitHub response did not match the expected issue schema",
                        hint: "This may indicate a GitHub API change — report this to the tool maintainer",
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
