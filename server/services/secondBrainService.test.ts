import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('../db/supabase.js', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock('../config.js', () => ({
  config: { geminiApiKey: 'test-key' },
}));

import {
  captureThought,
  classifyText,
  deleteThought,
  getDigestData,
  getEmbedding,
  listProjects,
  listPeople,
  semanticSearch,
  updateProject,
  updateThought,
  routeThought,
} from './secondBrainService.js';

describe('secondBrainService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  function mockFetchJson(data: unknown) {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => data,
      text: async () => JSON.stringify(data),
    });
  }

  describe('classifyText (prefix path)', () => {
    it('classifies projects: prefix without calling Gemini', async () => {
      const result = await classifyText('projects: Build the API');
      expect(result).toEqual({
        category: 'PROJECTS',
        confidence: 95,
        title: 'Build the API',
        detail: 'Build the API',
        extracted: expect.objectContaining({ title: 'Build the API' }),
      });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('classifies ideas: prefix', async () => {
      const result = await classifyText('ideas: What if we could X?');
      expect(result.category).toBe('IDEAS');
      expect(result.confidence).toBe(95);
    });

    it('classifies admin: prefix', async () => {
      const result = await classifyText('admin: Call John tomorrow');
      expect(result.category).toBe('ADMIN');
    });
  });

  describe('classifyText (Gemini path)', () => {
    it('uses Gemini when no prefix matches and returns classification', async () => {
      mockFetchJson({
        candidates: [
          {
            content: {
              parts: [{ text: '{"category":"IDEAS","confidence":85,"title":"Creative thought","detail":"full text","extracted":{}}' }],
            },
          },
        ],
      });

      const result = await classifyText('I wonder what would happen if...');
      expect(result.category).toBe('IDEAS');
      expect(result.confidence).toBe(85);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('defaults to REVIEW when Gemini returns invalid category', async () => {
      mockFetchJson({
        candidates: [
          {
            content: {
              parts: [{ text: '{"category":"INVALID","confidence":50,"title":"x","detail":"x","extracted":{}}' }],
            },
          },
        ],
      });

      const result = await classifyText('Something ambiguous');
      expect(result.category).toBe('REVIEW');
    });
  });

  describe('getEmbedding', () => {
    it('returns embedding from Gemini API', async () => {
      mockFetchJson({ embedding: { values: [0.1, 0.2, 0.3] } });
      const result = await getEmbedding('hello');
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('throws when API returns no values', async () => {
      mockFetchJson({});
      await expect(getEmbedding('hello')).rejects.toThrow('no values');
    });
  });

  describe('captureThought', () => {
    it('stores thought and routes when prefix matches with high confidence', async () => {
      mockFetchJson({ embedding: { values: [0.1] } });
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'thought-1' },
          error: null,
        }),
      };
      const updateChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      fromMock.mockImplementation((table: string) => {
        if (table === 'sb_thoughts') return { insert: () => insertChain, update: () => updateChain, eq: () => ({}) };
        if (table === 'sb_projects') return { insert: vi.fn().mockResolvedValue({ error: null }) };
        return {};
      });

      const result = await captureThought('projects: New feature', 'web');
      expect(result.thoughtId).toBe('thought-1');
      expect(result.category).toBe('PROJECTS');
      expect(result.routed).toBe(true);
    });

    it('throws when rawText is empty', async () => {
      await expect(captureThought('', 'manual')).rejects.toThrow('rawText is required');
    });
  });

  describe('listProjects', () => {
    it('returns projects from Supabase', async () => {
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'p1', name: 'Project A' }],
          error: null,
        }),
      };
      fromMock.mockReturnValue(selectChain);

      const result = await listProjects(10);
      expect(result).toEqual([{ id: 'p1', name: 'Project A' }]);
      expect(fromMock).toHaveBeenCalledWith('sb_projects');
    });

    it('throws when Supabase returns error', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } }),
      });
      await expect(listProjects()).rejects.toThrow('Failed to list sb_projects');
    });
  });

  describe('listPeople', () => {
    it('returns people from Supabase', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'pe1', name: 'Alice' }],
          error: null,
        }),
      });
      const result = await listPeople(5);
      expect(result).toEqual([{ id: 'pe1', name: 'Alice' }]);
      expect(fromMock).toHaveBeenCalledWith('sb_people');
    });
  });

  describe('semanticSearch', () => {
    it('returns search results from RPC', async () => {
      mockFetchJson({ embedding: { values: [0.1, 0.2] } });
      rpcMock.mockResolvedValue({
        data: [
          { table_name: 'projects', record_id: 'p1', label: 'Foo', detail: 'Bar', similarity: 0.9, created_at: '2024-01-01' },
        ],
        error: null,
      });

      const result = await semanticSearch('query', 0.6, 5);
      expect(result).toHaveLength(1);
      expect(result[0].table_name).toBe('projects');
      expect(result[0].similarity).toBe(0.9);
    });

    it('throws when RPC fails', async () => {
      mockFetchJson({ embedding: { values: [0.1] } });
      rpcMock.mockResolvedValue({ data: null, error: { message: 'rpc failed' } });
      await expect(semanticSearch('q')).rejects.toThrow('Search failed');
    });
  });

  describe('updateProject', () => {
    it('updates project and returns id', async () => {
      fromMock.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const result = await updateProject('p1', { status: 'done' });
      expect(result).toEqual({ id: 'p1' });
    });

    it('returns id when no valid updates', async () => {
      const result = await updateProject('p1', {});
      expect(result).toEqual({ id: 'p1' });
    });
  });

  describe('updateThought', () => {
    it('updates thought and recomputes embedding when rawText changes', async () => {
      mockFetchJson({ embedding: { values: [0.5] } });
      fromMock.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const result = await updateThought('t1', { rawText: 'Updated text' });
      expect(result).toEqual({ id: 't1' });
    });

    it('throws when rawText is empty', async () => {
      await expect(updateThought('t1', { rawText: '   ' })).rejects.toThrow('rawText cannot be empty');
    });
  });

  describe('routeThought', () => {
    it('re-classifies and routes when thought has routeable prefix', async () => {
      mockFetchJson({ embedding: { values: [0.1] } });
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 't1', raw_text: 'ideas: New insight' },
          error: null,
        }),
      };
      fromMock.mockImplementation((table: string) => {
        if (table === 'sb_thoughts')
          return {
            select: () => selectChain,
            update: () => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        if (table === 'sb_ideas') return { insert: vi.fn().mockResolvedValue({ error: null }) };
        return {};
      });

      const result = await routeThought('t1');
      expect(result.routed).toBe(true);
      expect(result.category).toBe('IDEAS');
    });
  });

  describe('deleteThought', () => {
    it('deletes thought in Supabase', async () => {
      fromMock.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await deleteThought('t1');
      expect(fromMock).toHaveBeenCalledWith('sb_thoughts');
    });

    it('throws when Supabase returns error', async () => {
      fromMock.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'constraint' } }),
      });
      await expect(deleteThought('t1')).rejects.toThrow('Failed to delete thought');
    });
  });

  describe('getDigestData', () => {
    it('returns projects, tasks due, and recent ideas', async () => {
      fromMock.mockImplementation((table: string) => {
        if (table === 'sb_projects')
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ name: 'P1' }], error: null }),
          };
        if (table === 'sb_admin')
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockResolvedValue({ data: [{ task: 'T1' }], error: null }),
          };
        if (table === 'sb_ideas')
          return {
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ data: [{ title: 'I1' }], error: null }),
          };
        return {};
      });

      const result = await getDigestData();
      expect(result.projects).toEqual([{ name: 'P1' }]);
      expect(result.tasksDue).toEqual([{ task: 'T1' }]);
      expect(result.ideasRecent).toEqual([{ title: 'I1' }]);
    });
  });
});
