'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Note } from '../useNotes';
import { createNote, updateNote, deleteNote } from '../useNotes';

interface OptimisticUpdate<T> {
  type: 'create' | 'update' | 'delete';
  id: string;
  optimisticData?: T;
  rollback: () => void;
}

interface UseOptimisticNotesOptions {
  /** Initial notes array */
  initialNotes: Note[] | null;
  /** Callback to refetch notes after successful operation */
  onRefetch: () => Promise<void>;
}

interface UseOptimisticNotesReturn {
  /** Notes with optimistic updates applied */
  notes: Note[] | null;
  /** Whether an optimistic update is in progress */
  isOptimistic: boolean;
  /** Create note with optimistic update */
  createNoteOptimistic: (input: {
    title?: string;
    content?: Record<string, unknown>;
    notebook_id?: string;
    tag_ids?: string[];
  }) => Promise<Note>;
  /** Update note with optimistic update */
  updateNoteOptimistic: (
    noteId: string,
    updates: {
      title?: string;
      content?: Record<string, unknown>;
      notebook_id?: string | null;
      tag_ids?: string[];
      is_pinned?: boolean;
      is_archived?: boolean;
    },
  ) => Promise<Note>;
  /** Delete note with optimistic update */
  deleteNoteOptimistic: (noteId: string) => Promise<void>;
}

/**
 * Hook for optimistic note updates.
 * Provides immediate UI feedback while API calls are in progress.
 * Automatically rolls back on error.
 */
export const useOptimisticNotes = ({
  initialNotes,
  onRefetch,
}: UseOptimisticNotesOptions): UseOptimisticNotesReturn => {
  const [notes, setNotes] = useState<Note[] | null>(initialNotes);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const pendingUpdatesRef = useRef<Map<string, OptimisticUpdate<Note>>>(new Map());

  // Sync with initialNotes when they change (from refetch)
  // Only sync when there are no pending optimistic updates
  useEffect(() => {
    if (initialNotes !== null && pendingUpdatesRef.current.size === 0) {
      setNotes(initialNotes);
    }
  }, [initialNotes]);

  // Apply optimistic update to notes array
  const applyOptimisticUpdate = useCallback((update: OptimisticUpdate<Note>): void => {
    setNotes((currentNotes) => {
      if (!currentNotes) return currentNotes;

      switch (update.type) {
        case 'create':
          if (update.optimisticData) {
            return [update.optimisticData, ...currentNotes];
          }
          break;
        case 'update':
          return currentNotes.map((note) =>
            note.id === update.id ? { ...note, ...update.optimisticData } : note,
          );
        case 'delete':
          return currentNotes.filter((note) => note.id !== update.id);
      }
      return currentNotes;
    });
    setIsOptimistic(true);
  }, []);

  // Rollback optimistic update
  const rollbackUpdate = useCallback((updateId: string): void => {
    const update = pendingUpdatesRef.current.get(updateId);
    if (update) {
      update.rollback();
      pendingUpdatesRef.current.delete(updateId);
      if (pendingUpdatesRef.current.size === 0) {
        setIsOptimistic(false);
      }
    }
  }, []);

  // Create note with optimistic update
  const createNoteOptimistic = useCallback(
    async (input: {
      title?: string;
      content?: Record<string, unknown>;
      notebook_id?: string;
      tag_ids?: string[];
    }): Promise<Note> => {
      // Generate temporary ID
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticNote: Note = {
        id: tempId,
        user_id: '', // Will be filled by server
        title: input.title || 'Untitled',
        content: input.content || {},
        content_text: null,
        notebook_id: input.notebook_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        is_pinned: false,
        is_archived: false,
        tags: [],
        attachments: [],
      };

      const updateId = tempId;
      const update: OptimisticUpdate<Note> = {
        type: 'create',
        id: tempId,
        optimisticData: optimisticNote,
        rollback: () => {
          setNotes((currentNotes) => {
            if (!currentNotes) return currentNotes;
            return currentNotes.filter((note) => note.id !== tempId);
          });
        },
      };

      pendingUpdatesRef.current.set(updateId, update);
      applyOptimisticUpdate(update);

      try {
        const createdNote = await createNote(input);
        // Replace optimistic note with real note
        setNotes((currentNotes) => {
          if (!currentNotes) return [createdNote];
          return currentNotes.map((note) => (note.id === tempId ? createdNote : note));
        });
        pendingUpdatesRef.current.delete(updateId);
        if (pendingUpdatesRef.current.size === 0) {
          setIsOptimistic(false);
        }
        // Refetch to ensure consistency
        await onRefetch();
        return createdNote;
      } catch (error) {
        rollbackUpdate(updateId);
        throw error;
      }
    },
    [applyOptimisticUpdate, rollbackUpdate, onRefetch],
  );

  // Update note with optimistic update
  const updateNoteOptimistic = useCallback(
    async (
      noteId: string,
      updates: {
        title?: string;
        content?: Record<string, unknown>;
        notebook_id?: string | null;
        tag_ids?: string[];
        is_pinned?: boolean;
        is_archived?: boolean;
      },
    ): Promise<Note> => {
      // Store original note for rollback
      const originalNote = notes?.find((n) => n.id === noteId);
      if (!originalNote) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      const updateId = `update-${noteId}`;
      const optimisticData: Partial<Note> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const update: OptimisticUpdate<Note> = {
        type: 'update',
        id: noteId,
        optimisticData: optimisticData as Note,
        rollback: () => {
          setNotes((currentNotes) => {
            if (!currentNotes || !originalNote) return currentNotes;
            return currentNotes.map((note) => (note.id === noteId ? originalNote : note));
          });
        },
      };

      pendingUpdatesRef.current.set(updateId, update);
      applyOptimisticUpdate(update);

      try {
        const updatedNote = await updateNote(noteId, updates);
        // Replace optimistic update with real update
        setNotes((currentNotes) => {
          if (!currentNotes) return [updatedNote];
          return currentNotes.map((note) => (note.id === noteId ? updatedNote : note));
        });
        pendingUpdatesRef.current.delete(updateId);
        if (pendingUpdatesRef.current.size === 0) {
          setIsOptimistic(false);
        }
        // Refetch to ensure consistency
        await onRefetch();
        return updatedNote;
      } catch (error) {
        rollbackUpdate(updateId);
        throw error;
      }
    },
    [notes, applyOptimisticUpdate, rollbackUpdate, onRefetch],
  );

  // Delete note with optimistic update
  const deleteNoteOptimistic = useCallback(
    async (noteId: string): Promise<void> => {
      // Store original note for rollback
      const originalNote = notes?.find((n) => n.id === noteId);
      if (!originalNote) {
        throw new Error(`Note with id ${noteId} not found`);
      }

      const updateId = `delete-${noteId}`;
      const update: OptimisticUpdate<Note> = {
        type: 'delete',
        id: noteId,
        rollback: () => {
          setNotes((currentNotes) => {
            if (!currentNotes || !originalNote) return currentNotes;
            // Restore original note at its original position
            const index = currentNotes.findIndex((n) => n.id === noteId);
            if (index === -1) {
              // If not found, add it back (best effort)
              return [...currentNotes, originalNote];
            }
            return currentNotes;
          });
        },
      };

      pendingUpdatesRef.current.set(updateId, update);
      applyOptimisticUpdate(update);

      try {
        await deleteNote(noteId);
        pendingUpdatesRef.current.delete(updateId);
        if (pendingUpdatesRef.current.size === 0) {
          setIsOptimistic(false);
        }
        // Refetch to ensure consistency
        await onRefetch();
      } catch (error) {
        rollbackUpdate(updateId);
        throw error;
      }
    },
    [notes, applyOptimisticUpdate, rollbackUpdate, onRefetch],
  );

  return {
    notes,
    isOptimistic,
    createNoteOptimistic,
    updateNoteOptimistic,
    deleteNoteOptimistic,
  };
};
