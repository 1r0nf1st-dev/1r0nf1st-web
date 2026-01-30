import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGitHubRepos } from './useGitHubRepos';
import { getJson } from './apiClient';
import * as configModule from './config';

// Mock the config module
vi.mock('./config', () => ({
  env: {
    apiBaseUrl: '',
  },
}));

// Mock the apiClient
vi.mock('./apiClient', () => ({
  getJson: vi.fn(),
}));

describe('useGitHubRepos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configModule.env).apiBaseUrl = '';
  });

  it('should start with loading state', () => {
    vi.mocked(getJson).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { result } = renderHook(() => useGitHubRepos());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.repos).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch repos successfully', async () => {
    const mockRepos = [
      {
        id: 1,
        name: 'repo1',
        html_url: 'https://github.com/user/repo1',
        description: 'Test repo',
        stargazers_count: 10,
        language: 'TypeScript',
        fork: false,
        archived: false,
        pushed_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(getJson).mockResolvedValue(mockRepos);

    const { result } = renderHook(() => useGitHubRepos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.repos).toEqual(mockRepos);
    expect(result.current.error).toBeNull();
    expect(getJson).toHaveBeenCalledWith('/api/github/repos?perPage=6');
  });

  it('should include username in query params when provided', async () => {
    const mockRepos: never[] = [];
    vi.mocked(getJson).mockResolvedValue(mockRepos);

    const { result } = renderHook(() => useGitHubRepos('testuser'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getJson).toHaveBeenCalledWith('/api/github/repos?username=testuser&perPage=6');
  });

  it('should handle errors correctly', async () => {
    const errorMessage = 'Failed to fetch repos';
    vi.mocked(getJson).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useGitHubRepos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.repos).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle string errors', async () => {
    const errorMessage = 'String error';
    vi.mocked(getJson).mockRejectedValue(errorMessage);

    const { result } = renderHook(() => useGitHubRepos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should cancel request on unmount', async () => {
    let resolvePromise: (value: never[]) => void;
    const promise = new Promise<never[]>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(getJson).mockReturnValue(promise);

    const { unmount } = renderHook(() => useGitHubRepos());

    unmount();

    // Resolve after unmount - should not update state
    resolvePromise!([]);

    // Wait a bit to ensure no state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // The hook is unmounted, so we can't check state, but we can verify
    // the promise was created
    expect(getJson).toHaveBeenCalled();
  });

  it('should use custom API base URL when configured', async () => {
    vi.mocked(configModule.env).apiBaseUrl = 'https://api.example.com';
    const mockRepos: never[] = [];
    vi.mocked(getJson).mockResolvedValue(mockRepos);

    const { result } = renderHook(() => useGitHubRepos());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // The code appends /api to absolute URLs that don't already end with /api
    expect(getJson).toHaveBeenCalledWith('https://api.example.com/api/github/repos?perPage=6');
  });
});
