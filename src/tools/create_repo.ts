import { octokit } from "../github/github-client.js";
import { mapGitHubError } from "../github/errorMap.js";
import { CreateRepoOutputSchema } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

// Tool metadata
export const CREATE_REPO_TOOL_NAME = "create-repo";
export const CREATE_REPO_TOOL_DESCRIPTION =
    "Create a new repository for the authenticated GitHub user. " +
    "Returns a DTO with: name, full_name, html_url, description, private, and default_branch.";

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
        const result = CreateRepoOutputSchema.safeParse(data);
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
