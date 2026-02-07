import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface GitHubCommitsState {
  commits: GitHubCommit[] | null;
  isLoading: boolean;
  error: string | null;
}

export function useGitHubCommits(repo: string | null): GitHubCommitsState {
  const [state, setState] = useState<GitHubCommitsState>({
    commits: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    if (!repo) {
      // Early return: reset state when repo becomes null
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Early return pattern: reset state when dependency becomes null
      setState((prev) => ({ ...prev, commits: null, isLoading: false, error: null }));
      return;
    }

    // Initialize loading state before async fetch
    setState((prev) => ({ ...prev, commits: null, isLoading: true, error: null }));

    const searchParams = new URLSearchParams({
      repo,
      perPage: '100',
    });

    // Construct the API URL - use relative /api in development (Vite proxy) or absolute URL in production
    let apiBase = '/api';
    if (env.apiBaseUrl && env.apiBaseUrl.trim()) {
      const trimmed = env.apiBaseUrl.trim();
      // If it's an absolute URL (starts with http), ensure it has /api suffix
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        // Remove trailing slash if present
        const normalized = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
        // Append /api only if it doesn't already end with /api
        apiBase = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
      } else {
        // If it's a relative path, use it as-is
        apiBase = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
      }
    }
    const url = `${apiBase}/github/commits?${searchParams.toString()}`;
    getJson<GitHubCommit[]>(url)
      .then((commits) => {
        if (isCancelled) return;
        setState({ commits, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        let message = 'Something went wrong fetching commits.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        // Provide more helpful error message for network errors
        if (message === 'Failed to fetch' || message.includes('fetch')) {
          message = 'Unable to connect to the API server. Please check your connection and try again.';
        }
        setState({ commits: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, [repo]);

  return state;
}
