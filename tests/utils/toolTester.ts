import { describe, it, expect, vi } from "vitest";
import { RequestError } from "@octokit/request-error";
import { z } from "zod";

export interface ToolTestConfig {
    toolName: string;
    handlerFactory: (deps: { octokit: any }) => any;
    validArgs: any;
    octokitPath: string[];
    mockSuccessData: any;
    outputSchema: z.ZodTypeAny;
    schemaErrorCode: string;
    expectedEndpoints?: string[];
    expectedOutput?: any;
}

function buildFakeOctokit(path: string[], mockMethod: any, calledEndpoints: string[]) {
    const proxyHandler: ProxyHandler<any> = {
        get(target: any, prop: string | symbol): any {
            if (prop === "then" || typeof prop === "symbol") return undefined;
            const currentPath = [...(target._path || []), prop];
            
            if (currentPath.join(".") === path.join(".")) {
                return (...args: any[]) => {
                    calledEndpoints.push(currentPath.join("."));
                    if (typeof mockMethod === 'function') return mockMethod(...args);
                    return mockMethod;
                };
            }
            
            const fn: any = function() {
                calledEndpoints.push(currentPath.join("."));
                return Promise.resolve({ data: {
                    sha: "dummy-sha",
                    commit: { sha: "dummy-sha" },
                    url: "dummy-url",
                    tree: { sha: "dummy" },
                    object: { sha: "dummy" }
                }});
            };
            fn._path = currentPath;
            return new Proxy(fn, proxyHandler);
        }
    };
    return new Proxy({ _path: [] }, proxyHandler);
}

export function runStandardToolTests(config: ToolTestConfig) {
    describe(`${config.toolName} - Standard Handler Tests`, () => {
        it("successfully executes when GitHub API returns expected data", async () => {
            const calledEndpoints: string[] = [];
            const fakeOctokit = buildFakeOctokit(config.octokitPath, vi.fn().mockResolvedValue({ data: config.mockSuccessData }), calledEndpoints);
            const handler = config.handlerFactory({ octokit: fakeOctokit });
            
            const response = await handler(config.validArgs);
            expect(response.isError).toBeFalsy();
            if (!response.isError && response.content) {
                const parsed = JSON.parse(response.content[0].text);
                const expected = config.expectedOutput ?? config.outputSchema.parse(config.mockSuccessData);
                expect(parsed).toEqual(expected);
            }
            if (config.expectedEndpoints) {
                expect(calledEndpoints.sort()).toEqual([...config.expectedEndpoints].sort());
            }
        });

        it("handles a 401 Unauthorized error from GitHub", async () => {
            const error401 = new RequestError("Unauthorized", 401, {
                request: { method: "POST", url: "https://api.github.com/test", headers: {} }
            });
            const fakeOctokit = buildFakeOctokit(config.octokitPath, vi.fn().mockRejectedValue(error401), []);
            const handler = config.handlerFactory({ octokit: fakeOctokit });
            
            const response = await handler(config.validArgs);
            expect(response.isError).toBe(true);
            const parsed = JSON.parse(response.content[0].text);
            expect(parsed.code).toBe("AuthenticationError");
            expect(parsed.message).toMatch(/invalid or missing/i);
        });

        it("handles a 404 Not Found error (Resource does not exist)", async () => {
            const error404 = new RequestError("Not Found", 404, {
                request: { method: "POST", url: "https://api.github.com/test", headers: {} }
            });
            const fakeOctokit = buildFakeOctokit(config.octokitPath, vi.fn().mockRejectedValue(error404), []);
            const handler = config.handlerFactory({ octokit: fakeOctokit });
            
            const response = await handler(config.validArgs);
            expect(response.isError).toBe(true);
            const parsed = JSON.parse(response.content[0].text);
            expect(parsed.code).toBe("GitHubAPIError");
            expect(parsed.message).toMatch(/not found/i);
        });

        it("handles a schema validation error when GitHub returns unexpected data structure", async () => {
            const badData = Array.isArray(config.mockSuccessData) ? [{ absolutely_wrong_field: "yes" }] : { absolutely_wrong_field: "yes" };
            const fakeOctokit = buildFakeOctokit(config.octokitPath, vi.fn().mockResolvedValue({ data: badData }), []);
            const handler = config.handlerFactory({ octokit: fakeOctokit });
            
            const response = await handler(config.validArgs);
            expect(response.isError).toBe(true);
            const parsed = JSON.parse(response.content[0].text);
            expect(parsed.code).toBe(config.schemaErrorCode);
        });
    });
}
