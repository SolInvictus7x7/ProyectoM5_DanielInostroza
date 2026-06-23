import { z } from "zod";
import { octokit } from "../github/github-client.js";
import { mapGitHubError } from "../github/errorMap.js";

// ═══ Contract ═══════════════════════════════════════════════════════

// Tool metadata
export const CREATE_REPO_TOOL_NAME = "create-repo";
export const CREATE_REPO_TOOL_DESCRIPTION =
    "Create a new repository for the authenticated GitHub user. " +
    "Returns a DTO with: name, full_name, html_url, description, private, and default_branch.";

// Input schema
export const CreateRepoInputShape = {
    repo_name: z.string().min(3).max(100).regex(/^[A-Za-z0-9._-]+$/, "Repository names can only contain alphanumeric characters, hyphens, underscores, and periods").describe("The name of the new repository."),
    description: z.string().describe("A short description of the repository."),
    add_readme: z.boolean().default(false).describe("Whether to initialize the repository with a README.md file."),
    private: z.boolean().optional().default(false).describe("Whether the repository is private."),
    gitignore_template: z.string().optional().describe("Desired language or platform .gitignore template to apply.")
};

// ═══ Output Schemas ═════════════════════════════════════════════════

const RepoSchema = z.object({
    name: z.string().describe("The repository name."),
    full_name: z.string().describe("The repository full name (e.g., owner/repo)."),
    html_url: z.string().url().describe("Browser URL to the new repository."),
    description: z.string().nullable().transform(v => v ?? "(no description)").describe("Repository description."),
    private: z.boolean().describe("Whether the repository is private."),
    default_branch: z.string().describe("The default branch of the repository.")
});

// Helper to normalize gitignore template names to match GitHub's case sensitivity
function formatGitignoreTemplate(template: string): string {
    const specialMap: Record<string, string> = {
        "c++": "C++",
        "objective-c": "Objective-C",
        "wordpress": "WordPress"
    };
    const lower = template.toLowerCase();
    if (specialMap[lower]) return specialMap[lower];
    
    // Default Title Case
    return template.charAt(0).toUpperCase() + lower.slice(1);
}

// ═══ Handler ════════════════════════════════════════════════════════

// Creates a repository for the authenticated user and returns its details
export async function createRepoHandler(args: { repo_name: string; description: string; add_readme: boolean; private: boolean; gitignore_template?: string }) {
    try {
        // Call Octokit to create the repository
        const { data } = await octokit.repos.createForAuthenticatedUser({
            name: args.repo_name,
            description: args.description,
            auto_init: args.add_readme,
            private: args.private,
            gitignore_template: args.gitignore_template ? formatGitignoreTemplate(args.gitignore_template) : undefined,
        });

        // safeParse instead of parse — graceful validation error
        const result = RepoSchema.safeParse(data);
        if (!result.success) {
            return {
                content: [{
                    type: "text" as const, text: JSON.stringify({
                        isError: true,
                        code: "SCHEMA_VALIDATION_ERROR",
                        message: "GitHub response did not match the expected repo schema",
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
        const mapped = mapGitHubError(error, { repo: args.repo_name });
        return {
            content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
            isError: true,
        };
    }
}
