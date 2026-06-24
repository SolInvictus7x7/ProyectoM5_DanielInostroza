import { runStandardToolTests } from "../utils/toolTester.js";
import { makecreateCommitHandler } from "../../src/tools/create_commit.js";
import { makelistCommitsHandler } from "../../src/tools/list_commits.js";
import { CreateCommitOutputSchema, ListCommitsOutputSchemaList } from "../../src/schemas/index.js";

runStandardToolTests({
    toolName: "create-commit",
    handlerFactory: makecreateCommitHandler,
    validArgs: { owner: "acme", repo: "test", message: "Init", branch: "main", files: [{ path: "a.txt", content: "b" }] },
    octokitPath: ["git", "createCommit"], 
    expectedEndpoints: [
        "git.getRef", 
        "git.getCommit", 
        "git.createBlob", 
        "git.createTree", 
        "git.createCommit", 
        "git.updateRef"
    ],
    outputSchema: CreateCommitOutputSchema,
    schemaErrorCode: "SCHEMA_VALIDATION_ERROR",
    expectedOutput: {
        sha: "1234567890abcdef",
        html_url: "https://github.com/acme/test/commit/1234567890abcdef",
    },
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
    expectedEndpoints: ["repos.listCommits"],
    outputSchema: ListCommitsOutputSchemaList,
    schemaErrorCode: "ValidationError",
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
