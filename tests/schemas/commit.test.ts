import { z } from "zod";
import { runSchemaTests } from "../utils/schemaTester.js";
import { CreateCommitInputShape, ListCommitsInputShape } from "../../src/schemas/index.js";

runSchemaTests("CreateCommitInput", z.object(CreateCommitInputShape), [
    {
        name: "accepts valid commit input",
        input: { owner: "acme", repo: "test", message: "Init", branch: "main", files: [{ path: "a.txt", content: "b" }] },
        expectSuccess: true
    },
    {
        name: "fails if files array is empty",
        input: { owner: "acme", repo: "test", message: "Init", branch: "main", files: [] },
        expectSuccess: false,
        expectedErrors: [{ path: "files", match: /Too small/i }]
    }
]);

runSchemaTests("ListCommitsInput", z.object(ListCommitsInputShape), [
    {
        name: "accepts valid list commits input",
        input: { owner: "acme", repo: "test", per_page: 50 },
        expectSuccess: true
    },
    {
        name: "fails if per_page is out of bounds",
        input: { owner: "acme", repo: "test", per_page: 150 }, // max 100
        expectSuccess: false,
        expectedErrors: [{ path: "per_page", match: /Too big/i }] // Zod default for max() is "Too big..."
    }
]);
