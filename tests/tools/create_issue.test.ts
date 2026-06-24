import { describe, it, expect, vi } from "vitest";
import { makecreateIssueHandler } from "../../src/tools/create_issue.js";
import { RequestError } from "@octokit/request-error";

describe("createIssueHandler - Tool Handler Tests", () => {
  it("successfully creates an issue when GitHub API returns expected data", async () => {
    // Setup a fake octokit client
    const fakeOctokit: any = {
      issues: {
        create: vi.fn().mockResolvedValue({
          data: {
            number: 42,
            title: "Test Issue",
            state: "open",
            html_url: "https://github.com/acme/repo/issues/42",
            body: "This is a test issue",
            user: { login: "testuser" },
            labels: [{ name: "bug" }],
            assignees: [{ login: "testuser" }]
          }
        })
      }
    };

    const handler = makecreateIssueHandler({ octokit: fakeOctokit });
    const response = await handler({
      owner: "acme",
      repo: "repo",
      title: "Test Issue"
    });

    expect(response.isError).toBeFalsy();
    if (!response.isError) {
      const contentText = response.content[0].text;
      const parsedContent = JSON.parse(contentText);
      expect(parsedContent.number).toBe(42);
      expect(parsedContent.title).toBe("Test Issue");
    }
  });

  it("handles a 401 Unauthorized error from GitHub", async () => {
    const error401 = new RequestError("Unauthorized", 401, {
      request: { method: "POST", url: "https://api.github.com/repos/acme/repo/issues", headers: {} }
    });

    const fakeOctokit: any = {
      issues: {
        create: vi.fn().mockRejectedValue(error401)
      }
    };

    const handler = makecreateIssueHandler({ octokit: fakeOctokit });
    const response = await handler({
      owner: "acme",
      repo: "repo",
      title: "Test Issue"
    });

    expect(response.isError).toBe(true);
    if (response.isError) {
        const contentText = response.content[0].text;
        const parsedContent = JSON.parse(contentText);
        expect(parsedContent.code).toBe("AuthenticationError");
        expect(parsedContent.message).toMatch(/invalid or missing/i);
    }
  });

  it("handles a 404 Not Found error (Repository does not exist)", async () => {
    const error404 = new RequestError("Not Found", 404, {
      request: { method: "POST", url: "https://api.github.com/repos/acme/missing-repo/issues", headers: {} }
    });

    const fakeOctokit: any = {
      issues: {
        create: vi.fn().mockRejectedValue(error404)
      }
    };

    const handler = makecreateIssueHandler({ octokit: fakeOctokit });
    const response = await handler({
      owner: "acme",
      repo: "missing-repo",
      title: "Test Issue"
    });

    expect(response.isError).toBe(true);
    if (response.isError) {
        const contentText = response.content[0].text;
        const parsedContent = JSON.parse(contentText);
        expect(parsedContent.code).toBe("GitHubAPIError");
        expect(parsedContent.message).toMatch(/repository acme\/missing-repo.*not found/i);
    }
  });

  it("handles a schema validation error when GitHub returns unexpected data structure", async () => {
    const fakeOctokit: any = {
      issues: {
        create: vi.fn().mockResolvedValue({
          data: {
            // Missing required fields like title, state, html_url etc.
            number: 42
          }
        })
      }
    };

    const handler = makecreateIssueHandler({ octokit: fakeOctokit });
    const response = await handler({
      owner: "acme",
      repo: "repo",
      title: "Test Issue"
    });

    expect(response.isError).toBe(true);
    if (response.isError) {
        const contentText = response.content[0].text;
        const parsedContent = JSON.parse(contentText);
        expect(parsedContent.code).toBe("SCHEMA_VALIDATION_ERROR");
        expect(parsedContent.message).toMatch(/GitHub response did not match/i);
    }
  });
});
