import { z } from "zod";
import { runSchemaTests } from "../utils/schemaTester.js";
import { CreateRepoInputShape, ListRepoInputShape } from "../../src/schemas/index.js";

runSchemaTests("ListRepoInput", z.object(ListRepoInputShape), [
    { name: "accepts empty input", input: {}, expectSuccess: true }
]);

runSchemaTests("CreateRepoInput", z.object(CreateRepoInputShape), [
    {
        name: "accepts valid repo input",
        input: { repo_name: "my-repo", description: "test", add_readme: true, private: false },
        expectSuccess: true
    },
    {
        name: "fails if repo_name is too short",
        input: { repo_name: "a", description: "test" },
        expectSuccess: false,
        expectedErrors: [{ path: "repo_name", match: /Too small/i }]
    },
    {
        name: "fails if repo_name has invalid chars",
        input: { repo_name: "invalid name!", description: "test" },
        expectSuccess: false,
        expectedErrors: [{ path: "repo_name", match: /alphanumeric/i }]
    }
]);
