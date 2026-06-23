import { z } from "zod";
import { octokit } from "../github/github-client.js";
import { mapGitHubError } from "../github/errorMap.js";

// ═══ Contract ═══════════════════════════════════════════════════════

export const CREATE_ISSUE_TOOL_NAME = "create-issue";
export const CREATE_ISSUE_TOOL_DESCRIPTION =
    "Create a new issue in a GitHub repository. " +
    "Returns a DTO with: number, title, state, html_url, body, user (login), labels (names), and assignees (logins).";

export const CreateIssueInputShape = {
    owner: z.string().min(1).regex(/^[A-Za-z0-9._-]+$/, "Owner name can only contain alphanumeric characters, hyphens, underscores, and periods").describe("GitHub username or org that owns the repo."),
    repo: z.string().min(1).regex(/^[A-Za-z0-9._-]+$/, "Repository names can only contain alphanumeric characters, hyphens, underscores, and periods").describe("Repository name."),
    title: z.string().min(1).describe("The title of the issue."),
    body: z.string().optional().describe("The body/description of the issue in markdown."),
    labels: z.array(z.string()).optional().describe("An array of label names to add to the issue."),
    assignees: z.array(z.string()).optional().describe("An array of GitHub usernames to assign to the issue.")
};

// ═══ Output Schemas ═════════════════════════════════════════════════

const IssueSchema = z.object({
    number: z.number().describe("Issue number."),
    title: z.string().describe("Issue title."),
    state: z.string().describe("open or closed."),
    html_url: z.string().url().describe("Browser URL to the issue."),
    body: z.string().nullable().transform((v) => v ?? "(no body)").describe("Issue body in markdown."),
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

// ═══ Handler ════════════════════════════════════════════════════════

export async function createIssueHandler(args: { owner: string; repo: string; title: string; body?: string; labels?: string[]; assignees?: string[] }) {
    try {
        // Direct call to create issue. If the repo doesn't exist, this naturally throws a 404
        // which our global error mapper will beautifully catch and format.
        const { data } = await octokit.issues.create({
            owner: args.owner,
            repo: args.repo,
            title: args.title,
            body: args.body,
            labels: args.labels,
            assignees: args.assignees,
        });

        const result = IssueSchema.safeParse(data);
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
        // We rely entirely on our centralized mapping here, which gracefully handles 404s
        const mapped = mapGitHubError(error, { owner: args.owner, repo: args.repo });
        return {
            content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
            isError: true,
        };
    }
}
