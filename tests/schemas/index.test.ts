import { describe, it, expect } from "vitest";
import { z } from "zod";
import { CreateIssueInputShape } from "../../src/schemas/index.js";

const CreateIssueInput = z.object(CreateIssueInputShape);

describe("CreateIssueInput schema contract - valid cases", () => {
  it("accepts a minimal valid input", () => {
    const res = CreateIssueInput.safeParse({
      owner: "acme-corp",
      repo: "mcp-backend",
      title: "Fix critical bug",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toEqual({
        owner: "acme-corp",
        repo: "mcp-backend",
        title: "Fix critical bug",
      });
    }
  });

  it("accepts an input with optional body and labels", () => {
    const res = CreateIssueInput.safeParse({
      owner: "acme-corp",
      repo: "mcp-backend",
      title: "Add new feature",
      body: "Detailed description of the feature.",
      labels: ["enhancement"],
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.body).toBeDefined();
      expect(res.data.labels).toEqual(["enhancement"]);
    }
  });

  it("accepts title at minimum allowed length", () => {
    const res = CreateIssueInput.safeParse({
      owner: "acme-corp",
      repo: "mcp-backend",
      title: "a", // length 1
    });
    expect(res.success).toBe(true);
  });
});

describe("CreateIssueInput schema contract - invalid cases", () => {
  it("fails if 'owner' is missing", () => {
    const res = CreateIssueInput.safeParse({
      repo: "mcp-backend",
      title: "Missing owner",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some(issue => issue.path[0] === "owner" && /expected.*undefined/i.test(issue.message))).toBe(true);
    }
  });

  it("fails if 'repo' is empty string", () => {
    const res = CreateIssueInput.safeParse({
      owner: "acme-corp",
      repo: "",
      title: "Empty repo",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some(issue => issue.path[0] === "repo" && /Too small/i.test(issue.message))).toBe(true);
    }
  });

  it("rejects an empty title", () => {
    const res = CreateIssueInput.safeParse({
      owner: "acme-corp",
      repo: "mcp-backend",
      title: "",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some(issue => issue.path[0] === "title" && /Too small/i.test(issue.message))).toBe(true);
    }
  });

  it("rejects invalid characters in owner/repo names", () => {
    const res = CreateIssueInput.safeParse({
      owner: "invalid owner!", // special char !
      repo: "mcp-backend",
      title: "Title",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some(issue => issue.path[0] === "owner" && /alphanumeric/i.test(issue.message))).toBe(true);
    }
  });
});
