import { useEffect, useState, useCallback } from 'react';
import { env } from './config';
import { getJson, ApiError } from './apiClient';
import { useAuth } from './contexts/AuthContext';

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: string;
  created_at: string;
}

function getApiBase(): string {
  let apiBase = '/api';
  if (env.apiBaseUrl && env.apiBaseUrl.trim()) {
    const trimmed = env.apiBaseUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const normalized = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
      apiBase = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
    } else {
      apiBase = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    }
  }
  return apiBase;
}

export function useSavedSearches(): {
  savedSearches: SavedSearch[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<{
    savedSearches: SavedSearch[] | null;
    isLoading: boolean;
    error: string | null;
  }>({
    savedSearches: null,
    isLoading: true,
    error: null,
  });

  const fetchSavedSearches = useCallback(async () => {
    if (!user) {
      setState({ savedSearches: null, isLoading: false, error: 'Please log in to view saved searches.' });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const url = `${getApiBase()}/notes/saved-searches`;
      const savedSearches = await getJson<SavedSearch[]>(url);
      setState({ savedSearches, isLoading: false, error: null });
    } catch (error: unknown) {
      let message = 'Something went wrong fetching saved searches.';
      if (error instanceof ApiError) {
        if (error.status === 401) {
          message = 'Please log in to view saved searches.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      setState({ savedSearches: null, isLoading: false, error: message });
    }
  }, [user]);

  useEffect(() => {
    // Don't make API calls if auth is still loading
    if (authLoading) {
      setState((prev) => ({ ...prev, isLoading: true }));
      return;
    }
    fetchSavedSearches().catch(() => {});
  }, [fetchSavedSearches, authLoading]);

  return {
    ...state,
    refetch: fetchSavedSearches,
  };
}

export async function createSavedSearch(input: {
  name: string;
  query: string;
}): Promise<SavedSearch> {
  const url = `${getApiBase()}/notes/saved-searches`;
  return getJson<SavedSearch>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteSavedSearch(savedSearchId: string): Promise<void> {
  const url = `${getApiBase()}/notes/saved-searches/${savedSearchId}`;
  await getJson<void>(url, {
    method: 'DELETE',
  });
}
