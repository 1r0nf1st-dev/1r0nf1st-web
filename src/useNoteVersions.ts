import { useState, useEffect } from 'react';
import { getJson, ApiError } from './apiClient';
import { getApiBase } from './config';

export interface NoteVersion {
  id: string;
  note_id: string;
  content: Record<string, unknown>;
  content_text: string | null;
  version_number: number;
  created_at: string;
}

interface NoteVersionsState {
  versions: NoteVersion[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useNoteVersions(noteId: string | null): NoteVersionsState {
  const [state, setState] = useState<Omit<NoteVersionsState, 'refetch'>>({
    versions: null,
    isLoading: false,
    error: null,
  });

  const fetchVersions = async () => {
    if (!noteId) {
      setState({ versions: null, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const versions = await getJson<NoteVersion[]>(`${getApiBase()}/notes/${noteId}/versions`);
      setState({ versions, isLoading: false, error: null });
    } catch (error: unknown) {
      let message = 'Something went wrong fetching note versions.';
      if (error instanceof ApiError) {
        if (error.status === 401) {
          message = 'Please log in to view note versions.';
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      setState({ versions: null, isLoading: false, error: message });
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [noteId]);

  return {
    ...state,
    refetch: fetchVersions,
  };
}

export async function getNoteVersion(
  noteId: string,
  versionNumber: number,
): Promise<NoteVersion> {
  const url = `${getApiBase()}/notes/${noteId}/versions/${versionNumber}`;
  return getJson<NoteVersion>(url);
}

export async function restoreNoteVersion(noteId: string, versionNumber: number): Promise<void> {
  const url = `${getApiBase()}/notes/${noteId}/versions/${versionNumber}/restore`;
  await getJson<{ message?: string }>(url, {
    method: 'POST',
  });
}
