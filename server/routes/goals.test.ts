import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { goalsRouter } from './goals.js';
import * as goalService from '../services/goalService.js';

vi.mock('../middleware/auth.js', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const r = req as express.Request & { userId: string; supabase?: unknown };
    r.userId = 'user-1';
    r.supabase = {}; // Mock user-scoped client; goalService is mocked so never used
    next();
  },
}));

vi.mock('../services/goalService.js');

function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/goals', goalsRouter);
  return app;
}

describe('goalsRouter', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /', () => {
    it('returns goals for authenticated user', async () => {
      vi.mocked(goalService.getGoalsByUserId).mockResolvedValue([
        { id: 'g1', user_id: 'user-1', title: 'Goal 1', status: 'active' } as never,
      ]);

      const res = await request(app).get('/api/goals');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Goal 1');
      expect(goalService.getGoalsByUserId).toHaveBeenCalledWith(
        expect.anything(),
        'user-1',
      );
    });
  });

  describe('POST /', () => {
    it('creates goal and returns 201', async () => {
      vi.mocked(goalService.createGoal).mockResolvedValue({
        id: 'g1',
        user_id: 'user-1',
        title: 'New Goal',
        status: 'active',
      } as never);

      const res = await request(app).post('/api/goals').send({ title: 'New Goal' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Goal');
      expect(goalService.createGoal).toHaveBeenCalledWith(
        expect.anything(),
        'user-1',
        expect.objectContaining({ title: 'New Goal' }),
      );
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/goals').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Title');
    });
  });

  describe('DELETE /:id', () => {
    it('returns 204 when goal deleted', async () => {
      vi.mocked(goalService.deleteGoal).mockResolvedValue();

      const res = await request(app).delete('/api/goals/g1');
      expect(res.status).toBe(204);
    });
  });
});
