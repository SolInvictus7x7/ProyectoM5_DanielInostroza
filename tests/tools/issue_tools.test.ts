import { runStandardToolTests } from "../utils/toolTester.js";
import { makecreateIssueHandler } from "../../src/tools/create_issue.js";
import { makelistIssuesHandler } from "../../src/tools/list_issues.js";
import { makeaddCommentToIssueHandler } from "../../src/tools/add_comment_to_issue.js";
import { makecloseIssueHandler } from "../../src/tools/close_issue.js";

runStandardToolTests({
    toolName: "create-issue",
    handlerFactory: makecreateIssueHandler,
    validArgs: { owner: "acme", repo: "test", title: "Bug" },
    octokitPath: ["issues", "create"],
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
    toolName: "list-issues",
    handlerFactory: makelistIssuesHandler,
    validArgs: { owner: "acme", repo: "test", include_details: false },
    octokitPath: ["issues", "listForRepo"],
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
    toolName: "add-comment-to-issue",
    handlerFactory: makeaddCommentToIssueHandler,
    validArgs: { owner: "acme", repo: "test", issue_number: 42, body: "Hello" },
    octokitPath: ["issues", "createComment"],
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
