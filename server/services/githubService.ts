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

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    let errorMessage = `GitHub API request failed with status ${response.status}`;
    
    try {
      const errorData = (await response.json()) as { message?: string; documentation_url?: string };
      if (errorData.message) {
        errorMessage = errorData.message;
        
        // Provide helpful guidance for common errors
        if (response.status === 401) {
          if (config.githubToken) {
            errorMessage += '. Your GITHUB_TOKEN may be invalid or expired. Please check your token at https://github.com/settings/tokens';
          } else {
            errorMessage += '. GITHUB_TOKEN is not set. Add it to your .env file (optional but recommended for higher rate limits).';
          }
        } else if (response.status === 404) {
          errorMessage += `. User "${effectiveUsername}" not found.`;
        } else if (response.status === 403) {
          errorMessage += '. Rate limit exceeded or access forbidden.';
        }
      }
    } catch {
      // If JSON parsing fails, use the text response
      const text = await response.text().catch(() => '');
      if (text) {
        errorMessage = text;
      }
    }
    
    throw new Error(errorMessage);
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

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    let errorMessage = `GitHub API request failed with status ${response.status}`;
    
    try {
      const errorData = (await response.json()) as { message?: string; documentation_url?: string };
      if (errorData.message) {
        errorMessage = errorData.message;
        
        // Provide helpful guidance for common errors
        if (response.status === 401) {
          if (config.githubToken) {
            errorMessage += '. Your GITHUB_TOKEN may be invalid or expired. Please check your token at https://github.com/settings/tokens';
          } else {
            errorMessage += '. GITHUB_TOKEN is not set. Add it to your .env file (optional but recommended for higher rate limits).';
          }
        } else if (response.status === 404) {
          errorMessage += `. Repository "${owner}/${repo}" not found.`;
        } else if (response.status === 403) {
          errorMessage += '. Rate limit exceeded or access forbidden.';
        }
      }
    } catch {
      // If JSON parsing fails, use the text response
      const text = await response.text().catch(() => '');
      if (text) {
        errorMessage = text;
      }
    }
    
    throw new Error(errorMessage);
  }

  return (await response.json()) as GitHubCommit[];
}
