import { z } from "zod";
import { octokit } from "../client/github-client.js";
// ─── Zod Input Shape ────────────────────────────────────────────────
//
// The MCP SDK's `server.tool()` expects a `ZodRawShapeCompat`
// (Record<string, AnySchema>). It wraps this into z.object() internally,
// converts to JSON Schema, and handles parsing — so we supply the shape.
// `.describe()` feeds the JSON Schema `description` field for LLM docs.
export const GetRepoInputShape = {
    owner: z
        .string()
        .min(1)
        .describe("The GitHub username or organization that owns the repository (e.g. 'facebook', 'microsoft')."),
    repo: z
        .string()
        .min(1)
        .describe("The exact name of the repository to retrieve (e.g. 'react', 'vscode')."),
};
// ─── Tool Metadata ──────────────────────────────────────────────────
export const GET_REPO_TOOL_NAME = "get-repo";
export const GET_REPO_TOOL_DESCRIPTION = "Fetch detailed information about a specific GitHub repository by its owner and name. " +
    "Returns metadata including description, stars, forks, open issues, primary language, " +
    "license, visibility, default branch, topics, creation date, and more.";
// ─── Zod Output Schema ─────────────────────────────────────────────
//
// Parses the Octokit response, cherry-picks useful fields, coalesces
// nulls into readable defaults, and transforms everything into a
// labeled text block — all in one Zod pipeline. This replaces the
// previous 50-line manual `formatRepoForLLM` template function.
// Helper: coerce null/undefined strings into a readable fallback
const str = (fallback = "(none)") => z.string().nullable().optional().transform((v) => v || fallback);
// Helper: coerce null/undefined numbers into 0
const num = () => z.number().nullable().optional().transform((v) => v ?? 0);
// Helper: coerce booleans into readable strings
const flag = () => z.boolean().nullable().optional().transform((v) => v ? "true" : "false");
// The actual output contract — maps Octokit's response to our domain
const RepoOutputSchema = z
    .object({
    name: z.string(),
    full_name: z.string(),
    description: str("(no description)"),
    html_url: z.string(),
    url: z.string(),
    homepage: str(),
    // Nested owner object, flattened into labeled fields
    owner: z
        .object({
        login: str("unknown"),
        html_url: str("unknown"),
        type: str("unknown"),
        avatar_url: str("unknown"),
    })
        .nullable()
        .optional()
        .transform((o) => o ?? { login: "unknown", html_url: "unknown", type: "unknown", avatar_url: "unknown" }),
    // Stats
    stargazers_count: num(),
    subscribers_count: num(),
    forks_count: num(),
    open_issues_count: num(),
    network_count: num(),
    size: num(),
    // Development metadata
    language: str("(not detected)"),
    default_branch: str("main"),
    license: z
        .object({ spdx_id: z.string().nullable().optional(), name: z.string().nullable().optional() })
        .nullable()
        .optional()
        .transform((l) => l?.spdx_id || l?.name || "(none)"),
    topics: z
        .array(z.string())
        .nullable()
        .optional()
        .transform((t) => (t && t.length > 0 ? t.join(", ") : "(none)")),
    // Boolean flags
    private: flag(),
    fork: flag(),
    archived: flag(),
    disabled: flag(),
    is_template: flag(),
    has_issues: flag(),
    has_projects: flag(),
    has_wiki: flag(),
    has_pages: flag(),
    has_downloads: flag(),
    has_discussions: flag(),
    // Timestamps
    created_at: str(),
    updated_at: str(),
    pushed_at: str(),
})
    // Final transform: convert the parsed object to labeled text for LLM consumption
    .transform((r) => [
    `=== Repository: ${r.full_name} ===`,
    "",
    "── General ──",
    `Name:            ${r.name}`,
    `Full Name:       ${r.full_name}`,
    `Description:     ${r.description}`,
    `URL:             ${r.html_url}`,
    `API URL:         ${r.url}`,
    `Homepage:        ${r.homepage}`,
    "",
    "── Owner ──",
    `Username:        ${r.owner.login}`,
    `Profile URL:     ${r.owner.html_url}`,
    `Type:            ${r.owner.type}`,
    `Avatar:          ${r.owner.avatar_url}`,
    "",
    "── Statistics ──",
    `Stars:           ${r.stargazers_count}`,
    `Watchers:        ${r.subscribers_count}`,
    `Forks:           ${r.forks_count}`,
    `Open Issues:     ${r.open_issues_count}`,
    `Network Count:   ${r.network_count}`,
    `Size (KB):       ${r.size}`,
    "",
    "── Development ──",
    `Language:        ${r.language}`,
    `Default Branch:  ${r.default_branch}`,
    `License:         ${r.license}`,
    `Topics:          ${r.topics}`,
    "",
    "── Flags ──",
    `Private:         ${r.private}`,
    `Fork:            ${r.fork}`,
    `Archived:        ${r.archived}`,
    `Disabled:        ${r.disabled}`,
    `Is Template:     ${r.is_template}`,
    `Has Issues:      ${r.has_issues}`,
    `Has Projects:    ${r.has_projects}`,
    `Has Wiki:        ${r.has_wiki}`,
    `Has Pages:       ${r.has_pages}`,
    `Has Downloads:   ${r.has_downloads}`,
    `Has Discussions: ${r.has_discussions}`,
    "",
    "── Dates ──",
    `Created:         ${r.created_at}`,
    `Last Updated:    ${r.updated_at}`,
    `Last Pushed:     ${r.pushed_at}`,
].join("\n"));
// ─── Tool Handler ───────────────────────────────────────────────────
//
// Called by the MCP SDK when the tool is invoked. Input is already
// validated by the SDK via GetRepoInputShape. The output is parsed
// and formatted through RepoOutputSchema's Zod pipeline.
export async function getRepoHandler(args) {
    try {
        // Fetch the repo data from GitHub
        const { data } = await octokit.repos.get({
            owner: args.owner,
            repo: args.repo,
        });
        // Parse + transform through Zod — validates AND formats in one step
        const formatted = RepoOutputSchema.parse(data);
        return {
            content: [{ type: "text", text: formatted }],
        };
    }
    catch (error) {
        // Surface a clean error message for the LLM
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        return {
            content: [
                {
                    type: "text",
                    text: `Error fetching repository '${args.owner}/${args.repo}': ${message}`,
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=get-repo.js.map