import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson, ApiError } from './apiClient';
import type { Notebook } from './useNotes';

interface NotebooksState {
  notebooks: Notebook[] | null;
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

export function useNotebooks(): NotebooksState {
  const [state, setState] = useState<Omit<NotebooksState, 'refetch'>>({
    notebooks: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isCancelled = false;
    // Initialize loading state before async fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Setting initial loading state before async operation is necessary
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const url = `${getApiBase()}/notes/notebooks`;
    getJson<Notebook[]>(url)
      .then((notebooks) => {
        if (!isCancelled) {
          setState({ notebooks, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          let message = 'Something went wrong fetching notebooks.';
          if (error instanceof ApiError) {
            if (error.status === 401) {
              message = 'Please log in to view your notebooks.';
            } else {
              message = error.message;
            }
          } else if (error instanceof Error) {
            message = error.message;
          } else if (typeof error === 'string') {
            message = error;
          }
          setState({ notebooks: null, isLoading: false, error: message });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const fetchNotebooks = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const url = `${getApiBase()}/notes/notebooks`;
      const notebooks = await getJson<Notebook[]>(url);
      setState({ notebooks, isLoading: false, error: null });
    } catch (error: unknown) {
      let message = 'Something went wrong fetching notebooks.';
      if (error instanceof ApiError) {
        if (error.status === 401) {
          message = 'Please log in to view your notebooks.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      setState({ notebooks: null, isLoading: false, error: message });
    }
  };

  return {
    ...state,
    refetch: async () => {
      await fetchNotebooks();
    },
  };
}

export async function createNotebook(input: {
  name: string;
  parent_id?: string;
  color?: string;
}): Promise<Notebook> {
  const url = `${getApiBase()}/notes/notebooks`;
  return getJson<Notebook>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function updateNotebook(
  notebookId: string,
  updates: {
    name?: string;
    parent_id?: string | null;
    color?: string;
  },
): Promise<Notebook> {
  const url = `${getApiBase()}/notes/notebooks/${notebookId}`;
  return getJson<Notebook>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
}

export async function deleteNotebook(notebookId: string): Promise<void> {
  const url = `${getApiBase()}/notes/notebooks/${notebookId}`;
  await getJson<void>(url, {
    method: 'DELETE',
  });
}
