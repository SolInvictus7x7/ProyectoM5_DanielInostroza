import { z } from "zod";
import { runSchemaTests } from "../utils/schemaTester.js";
import { CreateIssueInputShape, ListIssuesInputShape, AddCommentToIssueInputShape, CloseIssueInputShape } from "../../src/schemas/index.js";

runSchemaTests("CreateIssueInput", z.object(CreateIssueInputShape), [
    {
        name: "accepts valid issue input",
        input: { owner: "acme", repo: "test", title: "Bug", body: "Fix it", labels: ["bug"] },
        expectSuccess: true
    },
    {
        name: "fails if title is empty",
        input: { owner: "acme", repo: "test", title: "" },
        expectSuccess: false,
        expectedErrors: [{ path: "title", match: /Too small/i }]
    },
    {
        name: "fails if owner is missing",
        input: { repo: "test", title: "Bug" },
        expectSuccess: false,
        expectedErrors: [{ path: "owner", match: /expected.*undefined/i }]
    }
]);

runSchemaTests("ListIssuesInput", z.object(ListIssuesInputShape), [
    {
        name: "accepts valid input",
        input: { owner: "acme", repo: "test", include_details: true },
        expectSuccess: true
    }
]);

runSchemaTests("AddCommentToIssueInput", z.object(AddCommentToIssueInputShape), [
    {
        name: "accepts valid comment input",
        input: { owner: "acme", repo: "test", issue_number: 1, body: "Hello" },
        expectSuccess: true
    },
    {
        name: "fails if body is empty",
        input: { owner: "acme", repo: "test", issue_number: 1, body: "" },
        expectSuccess: false,
        expectedErrors: [{ path: "body", match: /Too small/i }]
    }
]);

runSchemaTests("CloseIssueInput", z.object(CloseIssueInputShape), [
    {
        name: "accepts valid close issue input",
        input: { owner: "acme", repo: "test", issue_number: 1 },
        expectSuccess: true
    }
]);
