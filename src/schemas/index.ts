import { z } from "zod";

// ═══ Shared Input Fields ══════════════════════════════════════════════════

// Note: Using standard GitHub allowed character regex: alphanumeric, hyphens, underscores, and periods
export const ownerSchema = z.string().min(1).regex(/^[A-Za-z0-9._-]+$/, "Owner name can only contain alphanumeric characters, hyphens, underscores, and periods").describe("GitHub username or org that owns the repo.");

export const repoSchema = z.string().min(1).regex(/^[A-Za-z0-9._-]+$/, "Repository names can only contain alphanumeric characters, hyphens, underscores, and periods").describe("Repository name.");

export const usernameSchema = z.string().min(1).regex(/^[A-Za-z0-9._-]+$/, "Username can only contain alphanumeric characters, hyphens, underscores, and periods").describe("GitHub username.");

// Repo name for creation has stricter length restrictions
export const createRepoNameSchema = z.string().min(3).max(100).regex(/^[A-Za-z0-9._-]+$/, "Repository names can only contain alphanumeric characters, hyphens, underscores, and periods").describe("The name of the new repository.");

// ═══ Input Shapes for Tools ═══════════════════════════════════════════════

export const ListIssuesInputShape = {
    owner: ownerSchema,
    repo: repoSchema,
    include_details: z.boolean().default(false).describe(
        "When false (default), returns a compact DTO with only essential fields. " +
        "When true, includes full body, label metadata, assignee URLs, milestone, comment count, and timestamps."
    ),
};

export const ListRepoInputShape = {};

export const CreateRepoInputShape = {
    repo_name: createRepoNameSchema,
    description: z.string().describe("A short description of the repository."),
    add_readme: z.boolean().default(false).describe("Whether to initialize the repository with a README.md file."),
    private: z.boolean().optional().default(false).describe("Whether the repository is private."),
    gitignore_template: z.string().optional().describe("Desired language or platform .gitignore template to apply.")
};

export const CreateIssueInputShape = {
    owner: ownerSchema,
    repo: repoSchema,
    title: z.string().min(1).describe("The title of the issue."),
    body: z.string().optional().describe("The body/description of the issue in markdown."),
    labels: z.array(z.string()).optional().describe("An array of label names to add to the issue."),
    assignees: z.array(z.string()).optional().describe("An array of GitHub usernames to assign to the issue.")
};

export const CreateCommitInputShape = {
    owner: ownerSchema,
    repo: repoSchema,
    message: z.string().min(1).describe("The commit message."),
    branch: z.string().min(1).default("main").describe("The branch to commit to (e.g., 'main' or 'master')."),
    files: z.array(z.object({
        path: z.string().min(1).describe("The file path inside the repo, e.g., 'src/index.js'"),
        content: z.string().min(1).describe("The raw content of the file")
    })).min(1).describe("An array of files to include in the commit.")
};

export const ListCommitsInputShape = {
    owner: ownerSchema,
    repo: repoSchema,
    per_page: z.number().min(1).max(100).default(30).describe("Number of commits to return (max 100).")
};

export const AddCommentToIssueInputShape = {
    owner: ownerSchema,
    repo: repoSchema,
    issue_number: z.number().min(1).describe("The number that identifies the issue."),
    body: z.string().min(1).describe("The comment body in markdown.")
};

export const CloseIssueInputShape = {
    owner: ownerSchema,
    repo: repoSchema,
    issue_number: z.number().min(1).describe("The number that identifies the issue to close.")
};


// ═══ Output Schemas ═══════════════════════════════════════════════════════

// --- Repositories ---

export const RepoItemSchema = z.object({
  name: z.string().describe("Repository name."),
  description: z.string().nullable().transform((v) => v ?? "(no description)").describe("Repo summary."),
  html_url: z.string().url().describe("Browser URL."),
  stargazers_count: z.number().describe("Star count."),
  fork: z.boolean().describe("Whether the repo is a fork."),
  private: z.boolean().describe("Whether the repo is private."),
  language: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Primary language."),
  updated_at: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Last update timestamp."),
});

export const ListRepoOutputSchema = z.array(RepoItemSchema);

export const CreateRepoOutputSchema = z.object({
    name: z.string().describe("The repository name."),
    full_name: z.string().describe("The repository full name (e.g., owner/repo)."),
    html_url: z.string().url().describe("Browser URL to the new repository."),
    description: z.string().nullable().transform(v => v ?? "(no description)").describe("Repository description."),
    private: z.boolean().describe("Whether the repository is private."),
    default_branch: z.string().describe("The default branch of the repository.")
});

// --- Issues ---

export const CompactIssueSchema = z.object({
    number: z.number().describe("Issue number."),
    title: z.string().describe("Issue title."),
    state: z.string().describe("open or closed."),
    html_url: z.string().url().describe("Browser URL to the issue."),
    user: z.object({ login: z.string() }).nullable()
        .transform((v) => v?.login ?? "(unknown)")
        .describe("Author login."),
    labels: z.array(z.union([z.string(), z.object({ name: z.string() })]))
        .transform((arr) => arr.map((l) => (typeof l === "string" ? l : l.name)))
        .describe("Label names."),
    assignees: z.array(z.object({ login: z.string() })).nullable()
        .transform((arr) => (arr ?? []).map((u) => u.login))
        .describe("Assignee logins."),
});

// Used by create_issue (compact + body)
export const CreateIssueOutputSchema = CompactIssueSchema.extend({
    body: z.string().nullable().transform((v) => v ?? "(no body)").describe("Issue body in markdown."),
});

// Used by list_issues (detailed)
export const DetailedIssueSchema = CompactIssueSchema.extend({
    body: z.string().nullable().transform((v) => v ?? "(no body)").describe("Issue body in markdown."),
    user: z.object({
        login: z.string().describe("GitHub username."),
        html_url: z.string().url().describe("Profile URL."),
    }).nullable()
        .transform((v) => v ?? { login: "(unknown)", html_url: "" })
        .describe("Issue author."),
    labels: z.array(z.union([z.string(), z.object({
        name: z.string().describe("Label name."),
        color: z.string().describe("Label hex color."),
        description: z.string().nullable().transform((v) => v ?? "(no description)").describe("Label description."),
    })]))
        .transform((arr) => arr.map((l) =>
            typeof l === "string" ? { name: l, color: "000000", description: "(no description)" } : l
        ))
        .describe("Labels with full metadata."),
    assignees: z.array(z.object({
        login: z.string().describe("GitHub username."),
        html_url: z.string().url().describe("Profile URL."),
    })).nullable()
        .transform((arr) => arr ?? [])
        .describe("Assigned users with profile URLs."),
    milestone: z.object({
        title: z.string().describe("Milestone title."),
        state: z.string().describe("open or closed."),
        due_on: z.string().nullable().transform((v) => v ?? "(no due date)").describe("Due date ISO timestamp."),
    }).nullable()
        .transform((v) => v ?? null)
        .describe("Associated milestone, if any."),
    comments: z.number().describe("Number of comments on this issue."),
    created_at: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Creation timestamp."),
    updated_at: z.string().nullable().transform((v) => v ?? "(unknown)").describe("Last update timestamp."),
});

export const CompactOutputSchemaList = z.array(CompactIssueSchema);
export const DetailedOutputSchemaList = z.array(DetailedIssueSchema);

export const AddCommentToIssueOutputSchema = z.object({
    id: z.number().describe("Comment ID."),
    html_url: z.string().url().describe("Browser URL to the comment."),
    body: z.string().nullable().transform(v => v ?? "(no body)").describe("Comment body in markdown."),
    user: z.object({ login: z.string() }).nullable()
        .transform((v) => v?.login ?? "(unknown)")
        .describe("Author login."),
});

export const CloseIssueOutputSchema = z.object({
    number: z.number().describe("Issue number."),
    state: z.string().describe("State of the issue (should be 'closed')."),
    html_url: z.string().url().describe("Browser URL to the closed issue."),
});

// --- Commits ---

export const CreateCommitOutputSchema = z.object({
    sha: z.string().describe("The new commit SHA."),
    html_url: z.string().url().describe("The browser URL of the commit."),
});

const CommitItemSchema = z.object({
    sha: z.string().describe("The commit SHA."),
    html_url: z.string().url().describe("Browser URL of the commit."),
    commit: z.object({
        message: z.string().nullable().transform(v => v ?? "(no message)").describe("The commit message."),
        author: z.object({
            name: z.string().nullable().transform(v => v ?? "(unknown)"),
            date: z.string().nullable().transform(v => v ?? "(unknown date)"),
        }).nullable().transform(v => v ?? { name: "(unknown)", date: "(unknown date)" })
    })
});

export const ListCommitsOutputSchemaList = z.array(CommitItemSchema);
