import { useEffect, useState } from 'react';
import { env } from './config';
import { getJson, ApiError } from './apiClient';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: Record<string, unknown>;
  content_text: string | null;
  notebook_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  tags?: Tag[];
  attachments?: Attachment[];
}

export interface Notebook {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

interface NotesFilters {
  notebook_id?: string;
  tag_id?: string;
  search?: string;
  archived?: boolean;
  pinned?: boolean;
}

interface NotesState {
  notes: Note[] | null;
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

export function useNotes(filters?: NotesFilters): NotesState {
  const [state, setState] = useState<Omit<NotesState, 'refetch'>>({
    notes: null,
    isLoading: true,
    error: null,
  });

  // Serialize filter so effect reliably re-runs when any filter (e.g. tag) changes
  const filterKey = [
    filters?.notebook_id ?? '',
    filters?.tag_id ?? '',
    filters?.search ?? '',
    filters?.archived === true ? '1' : filters?.archived === false ? '0' : '',
    filters?.pinned === true ? '1' : filters?.pinned === false ? '0' : '',
  ].join('|');

  useEffect(() => {
    let isCancelled = false;
    // Initialize loading state before async fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Setting initial loading state before async operation is necessary
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const searchParams = new URLSearchParams();
    if (filters?.notebook_id) searchParams.set('notebook_id', filters.notebook_id);
    if (filters?.tag_id) searchParams.set('tag_id', filters.tag_id);
    if (filters?.search) searchParams.set('search', filters.search);
    if (filters?.archived !== undefined) searchParams.set('archived', String(filters.archived));
    if (filters?.pinned !== undefined) searchParams.set('pinned', String(filters.pinned));

    const url = `${getApiBase()}/notes?${searchParams.toString()}`;
    getJson<Note[]>(url)
      .then((notes) => {
        if (!isCancelled) {
          setState({ notes, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          let message = 'Something went wrong fetching notes.';
          if (error instanceof ApiError) {
            if (error.status === 401) {
              message = 'Please log in to view your notes.';
            } else {
              message = error.message;
            }
          } else if (error instanceof Error) {
            message = error.message;
          } else if (typeof error === 'string') {
            message = error;
          }
          setState({ notes: null, isLoading: false, error: message });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [filterKey]);

  const fetchNotes = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const searchParams = new URLSearchParams();
      if (filters?.notebook_id) searchParams.set('notebook_id', filters.notebook_id);
      if (filters?.tag_id) searchParams.set('tag_id', filters.tag_id);
      if (filters?.search) searchParams.set('search', filters.search);
      if (filters?.archived !== undefined) searchParams.set('archived', String(filters.archived));
      if (filters?.pinned !== undefined) searchParams.set('pinned', String(filters.pinned));

      const url = `${getApiBase()}/notes?${searchParams.toString()}`;
      const notes = await getJson<Note[]>(url);
      setState({ notes, isLoading: false, error: null });
    } catch (error: unknown) {
      let message = 'Something went wrong fetching notes.';
      if (error instanceof ApiError) {
        if (error.status === 401) {
          message = 'Please log in to view your notes.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      setState({ notes: null, isLoading: false, error: message });
    }
  };

  return {
    ...state,
    refetch: async () => {
      await fetchNotes();
    },
  };
}

export async function getNoteById(noteId: string): Promise<Note> {
  const url = `${getApiBase()}/notes/${noteId}`;
  return getJson<Note>(url);
}

export async function createNote(input: {
  title?: string;
  content?: Record<string, unknown>;
  notebook_id?: string;
  tag_ids?: string[];
}): Promise<Note> {
  const url = `${getApiBase()}/notes`;
  return getJson<Note>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function updateNote(
  noteId: string,
  updates: {
    title?: string;
    content?: Record<string, unknown>;
    notebook_id?: string | null;
    tag_ids?: string[];
    is_pinned?: boolean;
    is_archived?: boolean;
  },
): Promise<Note> {
  const url = `${getApiBase()}/notes/${noteId}`;
  return getJson<Note>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  const url = `${getApiBase()}/notes/${noteId}`;
  await getJson<void>(url, {
    method: 'DELETE',
  });
}

export async function restoreNote(noteId: string): Promise<Note> {
  const url = `${getApiBase()}/notes/${noteId}/restore`;
  return getJson<Note>(url, {
    method: 'POST',
  });
}

export async function searchNotes(query: string): Promise<Note[]> {
  const url = `${getApiBase()}/notes/search?q=${encodeURIComponent(query)}`;
  return getJson<Note[]>(url);
}
