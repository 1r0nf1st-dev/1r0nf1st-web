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

    getJson<GitHubRepo[]>(`${env.apiBaseUrl}/api/github/repos?${searchParams.toString()}`)
      .then((repos) => {
        if (isCancelled) return;
        setState({ repos, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        const message =
          error instanceof Error ? error.message : 'Something went wrong fetching repositories.';
        setState({ repos: null, isLoading: false, error: message });
      });

    return () => {
      isCancelled = true;
    };
  }, [username]);

  return state;
}
