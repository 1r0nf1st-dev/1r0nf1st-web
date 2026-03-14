import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const fromMock = vi.fn();
  return {
    selectMock: vi.fn(),
    eqMock: vi.fn(),
    orMock: vi.fn(),
    inMock: vi.fn(),
    isMock: vi.fn(),
    fromMock,
    mockSupabase: { from: fromMock },
  };
});
vi.mock('../db/supabase.js', () => ({ supabase: mocks.mockSupabase }));

import { getSharedNotesCount } from './noteService.js';

describe('getSharedNotesCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the first query (shared_notes)
    const sharedNotesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn(),
    };
    
    // Mock the second query (notes)
    const notesChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn(),
    };
    
    mocks.fromMock.mockImplementation((table: string) => {
      if (table === 'shared_notes') {
        return sharedNotesChain;
      }
      if (table === 'notes') {
        return notesChain;
      }
      return { select: mocks.selectMock };
    });
    
    // First query returns data with note_ids
    sharedNotesChain.or.mockResolvedValue({
      data: [{ note_id: 'note-1' }, { note_id: 'note-2' }, { note_id: 'note-3' }],
      error: null,
    });
    
    // Second query returns count
    notesChain.is.mockResolvedValue({
      count: 7,
      error: null,
    });
  });

  it('returns exact count from Supabase', async () => {
    const count = await getSharedNotesCount(mocks.mockSupabase as never, 'user-1');
    expect(count).toBe(7);
    expect(mocks.fromMock).toHaveBeenCalledWith('shared_notes');
    expect(mocks.fromMock).toHaveBeenCalledWith('notes');
  });

  it('returns 0 when count is null', async () => {
    // Mock empty shared_notes result
    const sharedNotesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mocks.fromMock.mockImplementation((table: string) => {
      if (table === 'shared_notes') {
        return sharedNotesChain;
      }
      return { select: vi.fn() };
    });
    
    await expect(getSharedNotesCount(mocks.mockSupabase as never, 'user-1')).resolves.toBe(0);
  });

  it('throws when Supabase returns an error', async () => {
    // Mock error from first query
    const sharedNotesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
    };
    mocks.fromMock.mockImplementation((table: string) => {
      if (table === 'shared_notes') {
        return sharedNotesChain;
      }
      return { select: vi.fn() };
    });
    
    await expect(getSharedNotesCount(mocks.mockSupabase as never, 'user-1')).rejects.toThrow(
      'Failed to fetch shared notes count: boom',
    );
  });
});
