import { z } from "zod";
export declare const GetRepoInputShape: {
    owner: z.ZodString;
    repo: z.ZodString;
};
export declare const GET_REPO_TOOL_NAME = "get-repo";
export declare const GET_REPO_TOOL_DESCRIPTION: string;
export declare function getRepoHandler(args: {
    owner: string;
    repo: string;
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
//# sourceMappingURL=get-repo.d.ts.map