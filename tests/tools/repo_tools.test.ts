import { runStandardToolTests } from "../utils/toolTester.js";
import { makelistRepoHandler } from "../../src/tools/list_repo.js";
import { makecreateRepoHandler } from "../../src/tools/create_repo.js";
import { ListRepoOutputSchema, CreateRepoOutputSchema } from "../../src/schemas/index.js";

runStandardToolTests({
    toolName: "list-repo",
    handlerFactory: makelistRepoHandler,
    validArgs: {},
    octokitPath: ["repos", "listForAuthenticatedUser"],
    expectedEndpoints: ["repos.listForAuthenticatedUser"],
    outputSchema: ListRepoOutputSchema,
    schemaErrorCode: "SCHEMA_VALIDATION_ERROR",
    mockSuccessData: [
        {
            name: "test-repo",
            description: "test desc",
            html_url: "https://github.com/acme/test-repo",
            stargazers_count: 5,
            fork: false,
            private: false,
            language: "TypeScript",
            updated_at: "2024-01-01T00:00:00Z"
        }
    ]
});

runStandardToolTests({
    toolName: "create-repo",
    handlerFactory: makecreateRepoHandler,
    validArgs: { repo_name: "new-repo", description: "testing", add_readme: true, private: false },
    octokitPath: ["repos", "createForAuthenticatedUser"],
    expectedEndpoints: ["repos.createForAuthenticatedUser"],
    outputSchema: CreateRepoOutputSchema,
    schemaErrorCode: "SCHEMA_VALIDATION_ERROR",
    mockSuccessData: {
        name: "new-repo",
        full_name: "acme/new-repo",
        html_url: "https://github.com/acme/new-repo",
        description: "testing",
        private: false,
        default_branch: "main"
    }
});
