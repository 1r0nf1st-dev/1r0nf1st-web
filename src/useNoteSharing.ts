import { useState } from 'react';
import { getJson, ApiError } from './apiClient';
import { getApiBase } from './config';

export interface SharedNote {
  id: string;
  note_id: string;
  owner_id: string;
  shared_with_user_id: string | null;
  share_token: string;
  permission: 'view' | 'edit';
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  shared_with_user?: {
    id: string;
    email?: string;
    username?: string;
  };
  owner?: {
    id: string;
    email?: string;
    username?: string;
  };
}

export interface ShareNoteInput {
  shared_with_user_id?: string; // Can be UUID or email
  shared_with_user_email?: string; // Alternative: email address
  permission?: 'view' | 'edit';
  expires_at?: string;
}

export async function shareNote(noteId: string, input: ShareNoteInput): Promise<SharedNote> {
  const url = `${getApiBase()}/notes/${noteId}/share`;
  return getJson<SharedNote>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function getNoteShares(noteId: string): Promise<SharedNote[]> {
  const url = `${getApiBase()}/notes/${noteId}/shares`;
  return getJson<SharedNote[]>(url);
}

export async function getSharedNotes(): Promise<unknown[]> {
  const url = `${getApiBase()}/notes/shared`;
  return getJson<unknown[]>(url);
}

export async function updateSharePermission(
  shareId: string,
  permission: 'view' | 'edit',
): Promise<SharedNote> {
  const url = `${getApiBase()}/notes/shares/${shareId}`;
  return getJson<SharedNote>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permission }),
  });
}

export async function unshareNote(shareId: string): Promise<void> {
  const url = `${getApiBase()}/notes/shares/${shareId}`;
  await getJson(url, {
    method: 'DELETE',
  });
}

export function useNoteShares(noteId: string | null) {
  const [shares, setShares] = useState<SharedNote[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShares = async () => {
    if (!noteId) {
      setShares(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getNoteShares(noteId);
      setShares(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch shares';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    shares,
    isLoading,
    error,
    refetch: fetchShares,
  };
}
