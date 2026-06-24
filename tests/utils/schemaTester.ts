import { describe, it, expect } from "vitest";
import { z } from "zod";

export interface SchemaTestCase {
    name: string;
    input: any;
    expectSuccess: boolean;
    expectedErrors?: { path: string; match: RegExp }[];
}

export function runSchemaTests(schemaName: string, schema: z.ZodTypeAny, cases: SchemaTestCase[]) {
    describe(`${schemaName} schema contract`, () => {
        for (const tc of cases) {
            it(tc.name, () => {
                const res = schema.safeParse(tc.input);
                expect(res.success).toBe(tc.expectSuccess);
                
                if (tc.expectSuccess && res.success) {
                    expect(res.data).toBeDefined();
                } else if (!tc.expectSuccess && !res.success && tc.expectedErrors) {
                    tc.expectedErrors.forEach(err => {
                        const hasMatchingError = res.error.issues.some(
                            issue => issue.path.join(".") === err.path
                        );
                        expect(hasMatchingError).toBe(true);
                    });
                }
            });
        }
    });
}
