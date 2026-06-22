import { z } from "zod";
export declare const LIST_REPO_TOOL_NAME = "list-repo";
export declare const LIST_REPO_TOOL_DESCRIPTION: string;
export declare const ListRepoInputShape: {
    username: z.ZodString;
};
export declare const ListRepoOutputSchema: z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    description: z.ZodPipe<z.ZodNullable<z.ZodString>, z.ZodTransform<string, string | null>>;
    html_url: z.ZodString;
    stargazers_count: z.ZodNumber;
    fork: z.ZodBoolean;
    language: z.ZodPipe<z.ZodNullable<z.ZodString>, z.ZodTransform<string, string | null>>;
    updated_at: z.ZodPipe<z.ZodNullable<z.ZodString>, z.ZodTransform<string, string | null>>;
}, z.core.$strip>>;
export declare function listRepoHandler(args: {
    username: string;
}): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=list_repo.d.ts.map