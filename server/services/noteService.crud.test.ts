import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock: crudFromMock, mockSupabase: crudMockSupabase } = vi.hoisted(() => {
  const fromMock = vi.fn();
  const mockSupabase = { from: (...args: unknown[]) => fromMock(...args) };
  return { fromMock, mockSupabase };
});
vi.mock('../db/supabase.js', () => ({ supabase: crudMockSupabase }));

import { createNote, getNoteById, updateNote, deleteNote } from './noteService.js';

describe('noteService CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNote', () => {
    it('inserts note and returns it', async () => {
      const insertedNote = {
        id: 'n1',
        user_id: 'u1',
        title: 'Test Note',
        content: {},
        notebook_id: null,
        is_pinned: false,
        is_archived: false,
      };
      crudFromMock.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: insertedNote, error: null }),
      });

      const result = await createNote(crudMockSupabase as never, 'u1', { title: 'Test Note' });
      expect(result.id).toBe('n1');
      expect(result.title).toBe('Test Note');
      expect(crudFromMock).toHaveBeenCalledWith('notes');
    });

    it('throws when Supabase returns error', async () => {
      crudFromMock.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'duplicate' } }),
      });

      await expect(createNote(crudMockSupabase as never, 'u1', { title: 'X' })).rejects.toThrow('Failed to create note');
    });
  });

  describe('getNoteById', () => {
    it('returns note when found', async () => {
      const noteData = { id: 'n1', user_id: 'u1', title: 'My Note', content: {}, notebook_id: null };
      crudFromMock.mockImplementation((table: string) => {
        if (table === 'notes')
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: noteData, error: null }),
                }),
              }),
            }),
          };
        if (table === 'note_tags')
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        if (table === 'attachments')
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        return {};
      });

      const result = await getNoteById(crudMockSupabase as never, 'n1', 'u1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('n1');
      expect(result?.title).toBe('My Note');
    });

    it('returns null when not found', async () => {
      crudFromMock.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      });

      const result = await getNoteById(crudMockSupabase as never, 'n99', 'u1');
      expect(result).toBeNull();
    });
  });

  describe('updateNote', () => {
    it('updates note and returns it', async () => {
      const existingNote = { id: 'n1', user_id: 'u1', title: 'Old', content: {}, notebook_id: null };
      const updatedNote = { ...existingNote, title: 'Updated' };
      let notesCallCount = 0;
      crudFromMock.mockImplementation((table: string) => {
        if (table === 'notes') {
          notesCallCount += 1;
          if (notesCallCount === 1)
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: existingNote, error: null }),
                  }),
                }),
              }),
            };
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedNote, error: null }),
          };
        }
        if (table === 'note_tags')
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) };
        if (table === 'attachments')
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
          };
        return {};
      });

      const result = await updateNote(crudMockSupabase as never, 'n1', 'u1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('throws when note not found', async () => {
      crudFromMock.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      });

      await expect(updateNote(crudMockSupabase as never, 'n99', 'u1', { title: 'X' })).rejects.toThrow(
        'Note not found or access denied',
      );
    });
  });

  describe('deleteNote', () => {
    it('soft-deletes note when found', async () => {
      const existingNote = { id: 'n1', user_id: 'u1', title: 'To delete' };
      let notesCallCount = 0;
      crudFromMock.mockImplementation((table: string) => {
        if (table === 'notes') {
          notesCallCount += 1;
          if (notesCallCount === 1)
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: existingNote, error: null }),
                  }),
                }),
              }),
            };
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          };
        }
        if (table === 'note_tags')
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) };
        if (table === 'attachments')
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
          };
        return {};
      });

      await deleteNote(crudMockSupabase as never, 'n1', 'u1');
      expect(crudFromMock).toHaveBeenCalledWith('notes');
    });

    it('throws when note not found', async () => {
      crudFromMock.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      });

      await expect(deleteNote(crudMockSupabase as never, 'n99', 'u1')).rejects.toThrow('Note not found or access denied');
    });
  });
});
