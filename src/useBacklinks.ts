import { useEffect, useState, useCallback } from 'react';
import { getJson, ApiError } from './apiClient';
import { getApiBase } from './config';
import type { Note } from './useNotes';

export function useBacklinks(noteId: string | null): {
  backlinks: Note[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [backlinks, setBacklinks] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBacklinks = useCallback(async () => {
    if (!noteId) {
      setBacklinks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = `${getApiBase()}/notes/${encodeURIComponent(noteId)}/backlinks`;
      const data = await getJson<Note[]>(url);
      setBacklinks(data);
    } catch (err) {
      setBacklinks([]);
      if (err instanceof ApiError && err.status === 401) {
        setError('Please log in.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load backlinks');
      }
    } finally {
      setIsLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchBacklinks();
  }, [fetchBacklinks]);

  return { backlinks, isLoading, error, refetch: fetchBacklinks };
}
