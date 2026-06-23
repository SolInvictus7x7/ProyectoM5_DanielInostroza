import { octokit } from "../github/github-client.js";
import { mapGitHubError } from "../github/errorMap.js";
import { CompactOutputSchemaList, DetailedOutputSchemaList } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

// Tool metadata — tells the agent what this tool does and what fields it returns
export const LIST_ISSUES_TOOL_NAME = "list-issues";
export const LIST_ISSUES_TOOL_DESCRIPTION =
    "List open issues for a GitHub repository. " +
    "By default returns a compact DTO per issue: number, title, state, html_url, user (login), labels (names only), assignees (logins only). " +
    "Set include_details=true to also get: body (markdown), label color/description, assignee profile URLs, milestone { title, state, due_on }, comments count, created_at, updated_at.";


// ═══ Handler ════════════════════════════════════════════════════════

// Fetches open issues for a repo, maps through compact or detailed DTO, returns JSON
export async function listIssuesHandler(args: { owner: string; repo: string; include_details: boolean }) {
    try {
        // Call Octokit to list issues for the given repo
        const { data } = await octokit.issues.listForRepo({
            owner: args.owner,
            repo: args.repo,
            state: "open",
            sort: "updated",
            direction: "desc",
            per_page: 30,
        });

        // Filter out pull requests — GitHub's issues endpoint includes PRs, identified by pull_request key
        const issuesOnly = data.filter((item) => !item.pull_request);

        // Pick the right schema based on the detail toggle
        const schema = args.include_details ? DetailedOutputSchemaList : CompactOutputSchemaList;

        // safeParse instead of parse — graceful validation error instead of a throw
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
        // Route all errors through the centralized mapper
        const mapped = mapGitHubError(error, { owner: args.owner, repo: args.repo });
        return {
            content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
            isError: true,
        };
    }
}
