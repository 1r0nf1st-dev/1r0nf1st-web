import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson, ApiError } from './apiClient';
import type { Tag } from './useNotes';

interface TagsState {
  tags: Tag[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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

export function useTags(): TagsState {
  const [state, setState] = useState<Omit<TagsState, 'refetch'>>({
    tags: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;
    // Initialize loading state before async fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Setting initial loading state before async operation is necessary
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const url = `${getApiBase()}/notes/tags`;
    getJson<Tag[]>(url)
      .then((tags) => {
        if (!isCancelled) {
          setState({ tags, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          let message = 'Something went wrong fetching tags.';
          if (error instanceof ApiError) {
            if (error.status === 401) {
              message = 'Please log in to view your tags.';
            } else {
              message = error.message;
            }
          } else if (error instanceof Error) {
            message = error.message;
          } else if (typeof error === 'string') {
            message = error;
          }
          setState({ tags: null, isLoading: false, error: message });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const fetchTags = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const url = `${getApiBase()}/notes/tags`;
      const tags = await getJson<Tag[]>(url);
      setState({ tags, isLoading: false, error: null });
    } catch (error: unknown) {
      let message = 'Something went wrong fetching tags.';
      if (error instanceof ApiError) {
        if (error.status === 401) {
          message = 'Please log in to view your tags.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      setState({ tags: null, isLoading: false, error: message });
    }
  };

  return {
    ...state,
    refetch: async () => {
      await fetchTags();
    },
  };
}

export async function createTag(input: { name: string; color?: string }): Promise<Tag> {
  const url = `${getApiBase()}/notes/tags`;
  return getJson<Tag>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function updateTag(
  tagId: string,
  updates: {
    name?: string;
    color?: string;
  },
): Promise<Tag> {
  const url = `${getApiBase()}/notes/tags/${tagId}`;
  return getJson<Tag>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
}

export async function deleteTag(tagId: string): Promise<void> {
  const url = `${getApiBase()}/notes/tags/${tagId}`;
  await getJson<void>(url, {
    method: 'DELETE',
  });
}
