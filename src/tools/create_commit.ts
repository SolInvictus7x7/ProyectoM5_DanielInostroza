import { octokit } from "../github/github_client.js";
import { mapGitHubError } from "../github/errorMap.js";
import { CreateCommitOutputSchema } from "../schemas/index.js";

// ═══ Contract ═══════════════════════════════════════════════════════

export const CREATE_COMMIT_TOOL_NAME = "create-commit";
export const CREATE_COMMIT_TOOL_DESCRIPTION =
    "Create a new commit in a GitHub repository using the Git Data API. " +
    "Allows committing multiple files simultaneously without needing a local clone. " +
    "Returns the new commit SHA and URL.";

// ═══ Handler ════════════════════════════════════════════════════════

export async function createCommitHandler(args: { owner: string; repo: string; message: string; branch: string; files: { path: string; content: string }[] }) {
    try {
        const refResp = await octokit.git.getRef({ 
            owner: args.owner, 
            repo: args.repo, 
            ref: `heads/${args.branch}` 
        });
        const baseCommitSha = refResp.data.object.sha;

        const baseCommit = await octokit.git.getCommit({ 
            owner: args.owner, 
            repo: args.repo, 
            commit_sha: baseCommitSha 
        });
        const baseTreeSha = baseCommit.data.tree.sha;

        const treeItems = await Promise.all(args.files.map(async (file) => {
            const blobResp = await octokit.git.createBlob({
                owner: args.owner,
                repo: args.repo,
                content: Buffer.from(file.content, "utf8").toString("base64"),
                encoding: "base64",
            });
            return {
                path: file.path,
                mode: "100644" as const,
                type: "blob" as const,
                sha: blobResp.data.sha,
            };
        }));

        const newTreeResp = await octokit.git.createTree({
            owner: args.owner,
            repo: args.repo,
            tree: treeItems,
            base_tree: baseTreeSha,
        });

        const commitResp = await octokit.git.createCommit({
            owner: args.owner,
            repo: args.repo,
            message: args.message,
            tree: newTreeResp.data.sha,
            parents: [baseCommitSha],
        });

        await octokit.git.updateRef({
            owner: args.owner,
            repo: args.repo,
            ref: `heads/${args.branch}`,
            sha: commitResp.data.sha,
        });

        const html_url = `https://github.com/${args.owner}/${args.repo}/commit/${commitResp.data.sha}`;

        const result = CreateCommitOutputSchema.safeParse({
            sha: commitResp.data.sha,
            html_url,
        });

        if (!result.success) {
            return {
                content: [{
                    type: "text" as const, text: JSON.stringify({
                        isError: true,
                        code: "SCHEMA_VALIDATION_ERROR",
                        message: "Failed to map commit output to schema",
                        hint: "Ensure the tool returns the correct structure",
                        details: result.error.message,
                    }, null, 2)
                }],
                isError: true,
            };
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }] };

    } catch (error: unknown) {
        const mapped = mapGitHubError(error, { owner: args.owner, repo: args.repo, branch: args.branch });
        return {
            content: [{ type: "text" as const, text: JSON.stringify(mapped, null, 2) }],
            isError: true,
        };
    }
}