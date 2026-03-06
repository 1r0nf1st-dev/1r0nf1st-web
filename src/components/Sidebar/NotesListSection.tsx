'use client';

import type { JSX } from 'react';
import { useMemo, useEffect, useState } from 'react';
import { useNotes, deleteNote } from '../../useNotes';
import { useNotesActions } from '../../contexts/NotesActionsContext';
import { useAlert } from '../../contexts/AlertContext';
import { useLiveRegion } from '../../contexts/LiveRegionContext';
import { Skeleton } from '../Skeleton';
import { FileText, Trash2 } from 'lucide-react';

export const NotesListSection = (): JSX.Element => {
  const { notes, isLoading, error, refetch } = useNotes({});
  const { selectNote, registerRefetch, refetchAllNotes } = useNotesActions();
  const { showAlert } = useAlert();
  const { announce } = useLiveRegion();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Register refetch callback so we get notified when notes change
  useEffect(() => {
    const unregister = registerRefetch(refetch);
    return unregister;
  }, [registerRefetch, refetch]);

  // Truncate note title to prevent overflow (max 25 characters for sidebar)
  const truncateTitle = (title: string | null | undefined, maxLength = 25): string => {
    if (!title || title.trim() === '') return 'Untitled';
    const trimmedTitle = title.trim();
    if (trimmedTitle.length <= maxLength) return trimmedTitle;
    return `${trimmedTitle.substring(0, maxLength)}...`;
  };

  // Show only recent notes (last 20)
  const recentNotes = useMemo(() => {
    if (!notes) return [];
    return [...notes]
      .sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 20);
  }, [notes]);

  const handleDelete = async (noteId: string) => {
    const note = notes?.find((n) => n.id === noteId);
    const noteTitle = note?.title || 'Untitled note';
    try {
      await deleteNote(noteId);
      await refetch();
      await refetchAllNotes();
      setConfirmDeleteId(null);
      announce(`Note "${noteTitle}" deleted`);
    } catch (error) {
      console.error('Failed to delete note:', error);
      showAlert('Failed to delete note. Please try again.', 'Error');
      announce(`Failed to delete note "${noteTitle}"`, 'assertive');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-1 px-2 py-1">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 py-1 text-xs text-muted">
        <p>Failed to load notes</p>
      </div>
    );
  }

  if (recentNotes.length === 0) {
    return (
      <div className="px-2 py-1 text-xs text-muted">
        <p>No notes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recentNotes.map((note) => (
        <div key={note.id} className="group relative">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                selectNote(note);
                announce(`Opened note: ${note.title || 'Untitled'}`);
              }}
              className="group relative flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground transition-colors hover:bg-primary/5 dark:hover:bg-primary/10"
              aria-label={`Open note: ${note.title || 'Untitled'}`}
            >
              <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <span className="truncate min-w-0" title={note.title || 'Untitled'}>
                {truncateTitle(note.title)}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Delete note ${note.title || 'Untitled'}`}
              onClick={() => setConfirmDeleteId(note.id)}
              className="opacity-0 group-hover:opacity-100 rounded-xl p-1 text-muted hover:bg-red-500/10 hover:text-red-500 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          {confirmDeleteId === note.id ? (
            <div aria-live="polite" className="mt-1 flex items-center gap-2 px-2 text-xs">
              <span>Delete?</span>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                className="rounded-xl bg-red-500/10 px-2 py-1 text-red-600 hover:bg-red-500/20"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-xl px-2 py-1 hover:bg-primary/10"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};
