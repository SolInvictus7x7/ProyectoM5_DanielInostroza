import { describe, it, expect } from "vitest";
import { mapGitHubError } from "../../src/github/errorMap.js";
import { RequestError } from "@octokit/request-error";

describe("mapGitHubError - Error transformations", () => {
  it("transforms 401 RequestError into an actionable AuthenticationError", () => {
    const error401 = new RequestError("Unauthorized", 401, {
      request: { method: "GET", url: "https://api.github.com/user", headers: {} }
    });

    const result = mapGitHubError(error401);
    expect(result.isError).toBe(true);
    expect(result.code).toBe("AuthenticationError");
    expect(result.message).toMatch(/invalid or missing/i);
    expect(result.hint).toMatch(/GITHUB_TOKEN/i);
  });

  it("transforms 403 RequestError (rate limit) into a NetworkError", () => {
    const error403 = new RequestError("API rate limit exceeded", 403, {
      request: { method: "GET", url: "https://api.github.com/user", headers: {} },
      response: {
        status: 403,
        url: "https://api.github.com/user",
        headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "12345" },
        data: {}
      }
    });

    const result = mapGitHubError(error403);
    expect(result.isError).toBe(true);
    expect(result.code).toBe("NetworkError");
    expect(result.message).toMatch(/rate limit/i);
    expect(result.hint).toMatch(/wait for the rate limit/i);
  });

  it("transforms 404 RequestError into a GitHubAPIError with clear message", () => {
    const error404 = new RequestError("Not Found", 404, {
      request: { method: "GET", url: "https://api.github.com/repos/owner/repo", headers: {} }
    });

    const result = mapGitHubError(error404, { owner: "acme", repo: "mcp-server" });
    expect(result.isError).toBe(true);
    expect(result.code).toBe("GitHubAPIError");
    expect(result.message).toMatch(/repository acme\/mcp-server.*not found/i);
  });

  it("transforms standard Error into a NetworkError", () => {
    const standardError = new Error("Connection reset by peer");
    const result = mapGitHubError(standardError);
    
    expect(result.isError).toBe(true);
    expect(result.code).toBe("NetworkError");
    expect(result.message).toMatch(/Connection reset by peer/i);
  });
});
