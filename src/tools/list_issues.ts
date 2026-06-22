import { z } from "zod";
import { octokit } from "../github/github-client.js";
import { mapGitHubError } from "../github/errorMap.js";

// ═══ Contract ═══════════════════════════════════════════════════════

// Tool metadata — tells the agent what this tool does and what fields it returns
export const LIST_ISSUES_TOOL_NAME = "list-issues";
export const LIST_ISSUES_TOOL_DESCRIPTION =
    "List open issues for a GitHub repository. " +
    "By default returns a compact DTO per issue: number, title, state, html_url, user (login), labels (names only), assignees (logins only). " +
    "Set include_details=true to also get: body (markdown), label color/description, assignee profile URLs, milestone { title, state, due_on }, comments count, created_at, updated_at.";

// Input schema — owner + repo to locate the repository, plus an optional detail toggle
export const ListIssuesInputShape = {
    owner: z.string().min(1).describe("GitHub username or org that owns the repo (e.g. 'facebook')."),
    repo: z.string().min(1).describe("Repository name (e.g. 'react')."),
    include_details: z.boolean().default(false).describe(
        "When false (default), returns a compact DTO with only essential fields. " +
        "When true, includes full body, label metadata, assignee URLs, milestone, comment count, and timestamps."
    ),
};

// ═══ Output Schemas ═════════════════════════════════════════════════

// Compact DTO — lightweight scan; maps nested objects to flat primitives
const CompactIssueSchema = z.object({
    number: z.number().describe("Issue number."),
    title: z.string().describe("Issue title."),
    state: z.string().describe("open or closed."),
    html_url: z.string().url().describe("Browser URL to the issue."),
    user: z.object({ login: z.string() }).nullable()
        .transform((v) => v?.login ?? "(unknown)")
        .describe("Author login."),
    labels: z.array(z.union([z.string(), z.object({ name: z.string() })]))
        .transform((arr) => arr.map((l) => (typeof l === "string" ? l : l.name)))
        .describe("Label names."),
    assignees: z.array(z.object({ login: z.string() })).nullable()
        .transform((arr) => (arr ?? []).map((u) => u.login))
        .describe("Assignee logins."),
});

// Detailed DTO — full context for an AI agent working on the issue
const DetailedIssueSchema = z.object({
    number: z.number().describe("Issue number."),
    title: z.string().describe("Issue title."),
    body: z.string().nullable().transform((v) => v ?? "(no body)").describe("Issue body in markdown."),
    state: z.string().describe("open or closed."),
    html_url: z.string().url().describe("Browser URL to the issue."),
    user: z.object({
        login: z.string().describe("GitHub username."),
        html_url: z.string().url().describe("Profile URL."),
    }).nullable()
        .transform((v) => v ?? { login: "(unknown)", html_url: "" })
        .describe("Issue author."),
    labels: z.array(z.union([z.string(), z.object({
        name: z.string().describe("Label name."),
        color: z.string().describe("Label hex color."),
        description: z.string().nullable().transform((v) => v ?? "(no description)").describe("Label description."),
    })]))
        .transform((arr) => arr.map((l) =>
            typeof l === "string" ? { name: l, color: "000000", description: "(no description)" } : l
        ))
        .describe("Labels with full metadata."),
    assignees: z.array(z.object({
        login: z.string().describe("GitHub username."),
        html_url: z.string().url().describe("Profile URL."),
    })).nullable()
        .transform((arr) => arr ?? [])
        .describe("Assigned users with profile URLs."),
    milestone: z.object({
        title: z.string().describe("Milestone title."),
        state: z.string().describe("open or closed."),
        due_on: z.string().nullable().transform((v) => v ?? "(no due date)").describe("Due date ISO timestamp."),
    }).nullable()
        .transform((v) => v ?? null)
        .describe("Associated milestone, if any."),
    comments: z.number().describe("Number of comments on this issue."),
    created_at: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Creation timestamp."),
    updated_at: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Last update timestamp."),
});

// Wrapped as arrays for the full response
const CompactOutputSchema = z.array(CompactIssueSchema);
const DetailedOutputSchema = z.array(DetailedIssueSchema);

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
        const schema = args.include_details ? DetailedOutputSchema : CompactOutputSchema;

        // safeParse instead of parse — graceful validation error instead of a throw
        const result = schema.safeParse(issuesOnly);
        if (!result.success) {
            return {
                content: [{ type: "text" as const, text: JSON.stringify({
                    isError: true,
                    code: "SCHEMA_VALIDATION_ERROR",
                    message: "GitHub response did not match the expected issue schema",
                    hint: "This may indicate a GitHub API change — report this to the tool maintainer",
                    details: result.error.message,
                }, null, 2) }],
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
