import { config } from '../config.js';

const GITHUB_API_BASE = 'https://api.github.com';

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

export async function fetchUserRepos(
  username?: string,
  options?: { perPage?: number },
): Promise<GitHubRepo[]> {
  const effectiveUsername = username ?? config.githubUsername;

  if (!effectiveUsername) {
    throw new Error('GitHub username is not configured. Set GITHUB_USERNAME in your .env.');
  }

  const searchParams = new URLSearchParams({
    sort: 'pushed',
    per_page: String(options?.perPage ?? 6),
  });

  const url = `${GITHUB_API_BASE}/users/${encodeURIComponent(effectiveUsername)}/repos?${searchParams.toString()}`;

  /* global HeadersInit */
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request to ${url} failed with status ${response.status}`);
  }

  return (await response.json()) as GitHubRepo[];
}

export async function fetchRepoCommits(
  owner: string,
  repo: string,
  options?: { perPage?: number },
): Promise<GitHubCommit[]> {
  if (!owner || !repo) {
    throw new Error('Owner and repo are required to fetch commits.');
  }

  const searchParams = new URLSearchParams({
    per_page: String(options?.perPage ?? 100),
  });

  const url = `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${searchParams.toString()}`;

  /* global HeadersInit */
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request to ${url} failed with status ${response.status}`);
  }

  return (await response.json()) as GitHubCommit[];
}
