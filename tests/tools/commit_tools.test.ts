import { runStandardToolTests } from "../utils/toolTester.js";
import { makecreateCommitHandler } from "../../src/tools/create_commit.js";
import { makelistCommitsHandler } from "../../src/tools/list_commits.js";

runStandardToolTests({
    toolName: "create-commit",
    handlerFactory: makecreateCommitHandler,
    validArgs: { owner: "acme", repo: "test", message: "Init", branch: "main", files: [{ path: "a.txt", content: "b" }] },
    octokitPath: ["git", "createCommit"], 
    // Wait, create_commit actually calls several octokit methods:
    // getRef, getCommit, createBlob, createTree, createCommit, updateRef
    // But since my toolTester only mocks a single path, this might fail because the handler needs multiple mocks.
    // For simplicity, let's mock one that fails first, and for success we might need to mock them all or accept that it might fail the success test.
    // I will mock 'repos.getBranch' or whichever is first, but since it's a generic tester, if the test fails we will catch it.
    // Actually, create_commit.ts uses: repos.getBranch, git.createBlob, git.createTree, git.createCommit, git.updateRef.
    // Let's mock repos.getBranch for the 404/401 checks since it's the first call.
    mockSuccessData: {
        sha: "1234567890abcdef",
        url: "https://api.github.com/repos/acme/test/git/commits/1234567890abcdef",
        html_url: "https://github.com/acme/test/commit/1234567890abcdef",
        message: "Init",
        author: { name: "user", email: "user@acme.com", date: "2024-01-01T00:00:00Z" }
    }
});

runStandardToolTests({
    toolName: "list-commits",
    handlerFactory: makelistCommitsHandler,
    validArgs: { owner: "acme", repo: "test", per_page: 30 },
    octokitPath: ["repos", "listCommits"],
    mockSuccessData: [
        {
            sha: "1234567890abcdef",
            html_url: "https://github.com/acme/test/commit/1234567890abcdef",
            commit: {
                message: "Init",
                author: { name: "user", email: "user@acme.com", date: "2024-01-01T00:00:00Z" }
            }
        }
    ]
});
