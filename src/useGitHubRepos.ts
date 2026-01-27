import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson } from './apiClient';

export interface GitHubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
}

interface GitHubReposState {
  repos: GitHubRepo[] | null;
  isLoading: boolean;
  error: string | null;
}

export function useGitHubRepos(username?: string): GitHubReposState {
  const [state, setState] = useState<GitHubReposState>({
    repos: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;

    const searchParams = new URLSearchParams();
    if (username) {
      searchParams.set('username', username);
    }
    searchParams.set('perPage', '6');

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
    const url = `${apiBase}/github/repos?${searchParams.toString()}`;
    getJson<GitHubRepo[]>(url)
      .then((repos) => {
        if (isCancelled) return;
        setState({ repos, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        let message = 'Something went wrong fetching repositories.';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }
        setState({ repos: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, [username]);

  return state;
}
