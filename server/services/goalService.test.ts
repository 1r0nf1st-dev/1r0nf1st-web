import { beforeEach, describe, expect, it, vi } from 'vitest';

const fromMock = vi.fn();

const mockSupabase = { from: (...args: unknown[]) => fromMock(...args) };
vi.mock('../db/supabase.js', () => ({ supabase: mockSupabase }));

import {
  createGoal,
  createMilestone,
  deleteGoal,
  deleteMilestone,
  getGoalById,
  getGoalsByUserId,
  getGoalWithMilestones,
  getMilestonesByGoalId,
  updateGoal,
  updateMilestone,
} from './goalService.js';

describe('goalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockChain(resolved: { data: unknown; error: unknown }) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(resolved),
    };
    return chain;
  }

  describe('getGoalsByUserId', () => {
    it('returns goals for user', async () => {
      const chain = mockChain({
        data: [{ id: 'g1', user_id: 'u1', title: 'Goal 1' }],
        error: null,
      });
      chain.single.mockRestore();
      chain.order.mockResolvedValue({ data: [{ id: 'g1', user_id: 'u1', title: 'Goal 1' }], error: null });
      fromMock.mockReturnValue(chain);

      const result = await getGoalsByUserId(mockSupabase as never, 'u1');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Goal 1');
    });

    it('throws when Supabase returns error', async () => {
      const chain = mockChain({ data: null, error: { message: 'db error' } });
      chain.single.mockRestore();
      chain.order.mockResolvedValue({ data: null, error: { message: 'db error' } });
      fromMock.mockReturnValue(chain);

      await expect(getGoalsByUserId(mockSupabase as never, 'u1')).rejects.toThrow('Failed to fetch goals');
    });
  });

  describe('getGoalById', () => {
    it('returns goal when found', async () => {
      const chain = mockChain({
        data: { id: 'g1', user_id: 'u1', title: 'My Goal' },
        error: null,
      });
      chain.eq = vi.fn().mockReturnValue(chain);
      fromMock.mockReturnValue(chain);

      const result = await getGoalById(mockSupabase as never, 'g1', 'u1');
      expect(result).toEqual({ id: 'g1', user_id: 'u1', title: 'My Goal' });
    });

    it('returns null when not found', async () => {
      const chain = mockChain({ data: null, error: { code: 'PGRST116' } });
      chain.eq = vi.fn().mockReturnValue(chain);
      fromMock.mockReturnValue(chain);

      const result = await getGoalById(mockSupabase as never, 'g1', 'u1');
      expect(result).toBeNull();
    });
  });

  describe('getGoalWithMilestones', () => {
    it('returns goal with milestones', async () => {
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'g1', user_id: 'u1', title: 'Goal' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{ id: 'm1', goal_id: 'g1', title: 'Milestone 1' }],
            error: null,
          }),
        });

      const result = await getGoalWithMilestones(mockSupabase as never, 'g1', 'u1');
      expect(result?.title).toBe('Goal');
      expect(result?.milestones).toHaveLength(1);
      expect(result?.milestones?.[0].title).toBe('Milestone 1');
    });
  });

  describe('createGoal', () => {
    it('inserts and returns goal', async () => {
      const chain = mockChain({
        data: { id: 'g1', user_id: 'u1', title: 'New Goal', status: 'active' },
        error: null,
      });
      chain.select = vi.fn().mockReturnValue(chain);
      chain.insert = vi.fn().mockReturnValue(chain);
      fromMock.mockReturnValue(chain);

      const result = await createGoal(mockSupabase as never, 'u1', { title: 'New Goal' });
      expect(result.title).toBe('New Goal');
      expect(result.id).toBe('g1');
    });
  });

  describe('updateGoal', () => {
    it('updates goal and returns it', async () => {
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'g1', user_id: 'u1' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'g1', user_id: 'u1', title: 'Updated', status: 'completed' },
            error: null,
          }),
        });

      const result = await updateGoal(mockSupabase as never, 'g1', 'u1', { title: 'Updated', status: 'completed' });
      expect(result.title).toBe('Updated');
    });

    it('throws when goal not found', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      });

      await expect(updateGoal(mockSupabase as never, 'g1', 'u1', { title: 'x' })).rejects.toThrow(
        'Goal not found or access denied',
      );
    });
  });

  describe('deleteGoal', () => {
    it('deletes goal when found', async () => {
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'g1' }, error: null }),
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

      await deleteGoal(mockSupabase as never, 'g1', 'u1');
    });
  });

  describe('createMilestone', () => {
    it('inserts milestone when goal exists', async () => {
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'g1' }, error: null }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'm1', goal_id: 'g1', title: 'M1' },
            error: null,
          }),
        });

      const result = await createMilestone(mockSupabase as never, 'u1', { goal_id: 'g1', title: 'M1' });
      expect(result.title).toBe('M1');
    });
  });

  describe('updateMilestone', () => {
    it('updates milestone and sets completed_at when completed', async () => {
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { goal_id: 'g1' }, error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'g1' }, error: null }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'm1', completed: true },
            error: null,
          }),
        });

      const result = await updateMilestone(mockSupabase as never, 'm1', 'u1', { completed: true });
      expect(result.completed).toBe(true);
    });
  });

  describe('deleteMilestone', () => {
    it('deletes milestone when goal belongs to user', async () => {
      fromMock
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { goal_id: 'g1' }, error: null }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'g1' }, error: null }),
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        });

      await deleteMilestone(mockSupabase as never, 'm1', 'u1');
    });
  });
});
