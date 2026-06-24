import { RequestError } from '@octokit/request-error';
import { logger } from '../utils/logger.js';

export function mapGitHubError(
  err: unknown,
  context?: Record<string, unknown>
): { isError: true; code: string; message: string; hint: string; details?: unknown } {
  logger.error("GitHub operation failed", err);

  if (err instanceof RequestError) {
    switch (err.status) {
      case 401:
        return {
          isError: true,
          code: 'AuthenticationError',
          message: 'The GitHub Personal Access Token provided is invalid or missing.',
          hint: 'Verify that GITHUB_TOKEN is correctly set in your environment.',
          details: context,
        };
      case 403: {
        const remaining = err.response?.headers?.['x-ratelimit-remaining'];
        if (remaining === '0') {
          return {
            isError: true,
            code: 'NetworkError',
            message: 'We have exceeded the GitHub API rate limit.',
            hint: 'We must wait for the rate limit to reset before making more requests.',
            details: { ...context, reset: err.response?.headers?.['x-ratelimit-reset'] },
          };
        }
        return {
          isError: true,
          code: 'AuthenticationError',
          message: 'You do not have sufficient permissions to perform this operation.',
          hint: 'Check your token scopes to ensure they cover repository and issue operations.',
          details: context,
        };
      }
      case 404: {
        const target = context?.['repo'] ? `The repository ${String(context['owner'])}/${String(context['repo'])}` : 'The requested resource';
        return {
          isError: true,
          code: 'GitHubAPIError',
          message: `${target} was not found or we lack permission to view it.`,
          hint: 'Double check the spelling of the owner and repository, or verify that your token has access to it.',
          details: context,
        };
      }
      case 422: {
        const githubMessage = (err.response?.data as Record<string, unknown>)?.['message'] as string || 'Unknown validation issue';
        return {
          isError: true,
          code: 'ValidationError',
          message: `GitHub rejected our request due to invalid data: ${githubMessage}.`,
          hint: 'Check the submitted fields, such as empty titles, invalid labels, or conflicting rules.',
          details: { ...context, errors: (err.response?.data as Record<string, unknown>)?.['errors'] },
        };
      }
      default:
        return {
          isError: true,
          code: 'GitHubAPIError',
          message: `An unexpected GitHub error occurred: ${err.message}`,
          hint: 'Please retry later or check the GitHub Service Status.',
          details: context,
        };
    }
  }

  const errorMessage = err instanceof Error ? err.message : 'Unknown network or system error';
  return {
    isError: true,
    code: 'NetworkError',
    message: `A system error prevented the operation from completing: ${errorMessage}`,
    hint: 'This may be a local network connectivity issue or a misconfiguration.',
    details: context,
  };
}