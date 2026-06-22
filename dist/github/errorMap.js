import { RequestError } from '@octokit/request-error';
// Maps Octokit errors to structured MCP error objects with code, message, and hint
export function mapGitHubError(err, context) {
    // Octokit-specific errors: match by HTTP status
    if (err instanceof RequestError) {
        switch (err.status) {
            case 401:
                return {
                    isError: true,
                    code: 'UNAUTHORIZED',
                    message: 'Invalid or missing GitHub token',
                    hint: 'Verify that GITHUB_TOKEN is set and valid',
                    details: context,
                };
            case 403: {
                // Detect rate limit exhaustion
                const remaining = err.response?.headers?.['x-ratelimit-remaining'];
                if (remaining === '0') {
                    return {
                        isError: true,
                        code: 'RATE_LIMIT',
                        message: 'GitHub rate limit exceeded',
                        hint: 'Wait for the rate limit to reset',
                        details: { ...context, reset: err.response?.headers?.['x-ratelimit-reset'] },
                    };
                }
                return {
                    isError: true,
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions for this operation',
                    hint: 'Check your token scopes (repo, issues, etc.)',
                    details: context,
                };
            }
            case 404:
                return {
                    isError: true,
                    code: 'NOT_FOUND',
                    message: 'Resource not found or no access permissions',
                    hint: 'Verify owner/repo/issue_number and your permissions',
                    details: context,
                };
            case 422:
                return {
                    isError: true,
                    code: 'VALIDATION_FAILED',
                    message: err.response?.data?.['message'] || 'GitHub validation failed',
                    hint: 'Check the submitted fields (empty titles, invalid labels, etc.)',
                    details: { ...context, errors: err.response?.data?.['errors'] },
                };
            default:
                return {
                    isError: true,
                    code: 'UPSTREAM_ERROR',
                    message: err.message || 'Unexpected GitHub error',
                    hint: 'Retry later or check service status',
                    details: context,
                };
        }
    }
    // Generic error (not a RequestError)
    return {
        isError: true,
        code: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
        hint: 'Contact the administrator',
        details: context,
    };
}
//# sourceMappingURL=errorMap.js.map