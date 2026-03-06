import { useEffect, useState, useCallback } from 'react';
import { getJson, ApiError } from './apiClient';
import { getApiBase } from './config';

export interface NoteTemplate {
  id: string;
  user_id: string;
  name: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useNoteTemplates(): {
  templates: NoteTemplate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setError(null);
    try {
      const url = `${getApiBase()}/notes/templates`;
      const data = await getJson<NoteTemplate[]>(url);
      setTemplates(data);
    } catch (err) {
      setTemplates([]);
      if (err instanceof ApiError && err.status === 401) {
        setError('Please log in.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, isLoading, error, refetch: fetchTemplates };
}

export async function createNoteTemplate(input: {
  name: string;
  content: Record<string, unknown>;
}): Promise<NoteTemplate> {
  const url = `${getApiBase()}/notes/templates`;
  return getJson<NoteTemplate>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteNoteTemplate(templateId: string): Promise<void> {
  const url = `${getApiBase()}/notes/templates/${encodeURIComponent(templateId)}`;
  await getJson<void>(url, { method: 'DELETE' });
}
