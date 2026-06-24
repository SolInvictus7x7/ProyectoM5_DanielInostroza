import { describe, it, expect, vi } from "vitest";
import { runStandardToolTests } from "../utils/toolTester.js";
import { makecreateIssueHandler } from "../../src/tools/create_issue.js";
import { makelistIssuesHandler } from "../../src/tools/list_issues.js";
import { makeaddCommentToIssueHandler } from "../../src/tools/add_comment_to_issue.js";
import { makecloseIssueHandler } from "../../src/tools/close_issue.js";
import { 
    CreateIssueOutputSchema, 
    CompactOutputSchemaList, 
    DetailedOutputSchemaList, 
    AddCommentToIssueOutputSchema, 
    CloseIssueOutputSchema 
} from "../../src/schemas/index.js";

runStandardToolTests({
    toolName: "create-issue",
    handlerFactory: makecreateIssueHandler,
    validArgs: { owner: "acme", repo: "test", title: "Bug" },
    octokitPath: ["issues", "create"],
    expectedEndpoints: ["issues.create"],
    outputSchema: CreateIssueOutputSchema,
    schemaErrorCode: "SCHEMA_VALIDATION_ERROR",
    mockSuccessData: {
        number: 42,
        title: "Bug",
        state: "open",
        html_url: "https://github.com/acme/test/issues/42",
        body: "Fix it",
        user: { login: "user" },
        labels: [],
        assignees: []
    }
});

runStandardToolTests({
    toolName: "list-issues (compact)",
    handlerFactory: makelistIssuesHandler,
    validArgs: { owner: "acme", repo: "test", include_details: false },
    octokitPath: ["issues", "listForRepo"],
    expectedEndpoints: ["issues.listForRepo"],
    outputSchema: CompactOutputSchemaList,
    schemaErrorCode: "SCHEMA_VALIDATION_ERROR",
    mockSuccessData: [
        {
            number: 42,
            title: "Bug",
            state: "open",
            html_url: "https://github.com/acme/test/issues/42",
            user: { login: "user" },
            labels: [],
            assignees: [],
            pull_request: undefined
        }
    ]
});

runStandardToolTests({
    toolName: "list-issues (detailed)",
    handlerFactory: makelistIssuesHandler,
    validArgs: { owner: "acme", repo: "test", include_details: true },
    octokitPath: ["issues", "listForRepo"],
    expectedEndpoints: ["issues.listForRepo"],
    outputSchema: DetailedOutputSchemaList,
    schemaErrorCode: "SCHEMA_VALIDATION_ERROR",
    mockSuccessData: [
        {
            number: 42,
            title: "Bug",
            state: "open",
            html_url: "https://github.com/acme/test/issues/42",
            body: "Detailed body",
            user: { login: "user", html_url: "https://github.com/user" },
            labels: [{ name: "bug", color: "ff0000", description: "A bug" }],
            assignees: [{ login: "user", html_url: "https://github.com/user" }],
            milestone: { title: "v1", state: "open", due_on: null },
            comments: 5,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            pull_request: undefined
        }
    ]
});

describe("list-issues - PR filtering", () => {
    it("excludes items with a pull_request field from the response", async () => {
        const mixedData = [
            { number: 1, title: "Real Issue", state: "open", html_url: "https://github.com/a/b/issues/1", user: { login: "u" }, labels: [], assignees: [], pull_request: undefined },
            { number: 2, title: "A PR", state: "open", html_url: "https://github.com/a/b/pull/2", user: { login: "u" }, labels: [], assignees: [], pull_request: { url: "..." } },
        ];
        const fakeOctokit: any = {
            issues: {
                listForRepo: vi.fn().mockResolvedValue({ data: mixedData })
            }
        };
        const handler = makelistIssuesHandler({ octokit: fakeOctokit });
        const response = await handler({ owner: "a", repo: "b", include_details: false });
        expect(response.isError).toBeFalsy();
        if (!response.isError) {
            const parsed = JSON.parse(response.content[0].text);
            expect(parsed).toHaveLength(1);
            expect(parsed[0].number).toBe(1);
        }
    });
});

runStandardToolTests({
    toolName: "add-comment-to-issue",
    handlerFactory: makeaddCommentToIssueHandler,
    validArgs: { owner: "acme", repo: "test", issue_number: 42, body: "Hello" },
    octokitPath: ["issues", "createComment"],
    expectedEndpoints: ["issues.createComment"],
    outputSchema: AddCommentToIssueOutputSchema,
    schemaErrorCode: "ValidationError",
    mockSuccessData: {
        id: 101,
        html_url: "https://github.com/acme/test/issues/42#issuecomment-101",
        body: "Hello",
        user: { login: "user" },
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
    }
});

runStandardToolTests({
    toolName: "close-issue",
    handlerFactory: makecloseIssueHandler,
    validArgs: { owner: "acme", repo: "test", issue_number: 42 },
    octokitPath: ["issues", "update"],
    expectedEndpoints: ["issues.update"],
    outputSchema: CloseIssueOutputSchema,
    schemaErrorCode: "ValidationError",
    mockSuccessData: {
        number: 42,
        title: "Bug",
        state: "closed",
        html_url: "https://github.com/acme/test/issues/42",
        user: { login: "user" },
        labels: [],
        assignees: []
    }
});
