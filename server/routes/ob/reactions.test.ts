import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import * as obReactionService from '../../services/obReactionService.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const r = req as express.Request & { userId: string; supabase?: unknown };
    r.userId = 'user-react-1';
    r.supabase = {};
    next();
  },
}));

vi.mock('../../middleware/requireAdmin.js', () => ({
  requireAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
}));

vi.mock('../../services/obReactionService.js');

const { obReactionsRouter } = await import('./reactions.js');

function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/ob/reactions', obReactionsRouter);
  return app;
}

describe('obReactionsRouter', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when listing without nodeId', async () => {
    const res = await request(app).get('/api/ob/reactions');
    expect(res.status).toBe(400);
  });

  it('returns 400 when adding reaction without nodeId', async () => {
    const res = await request(app).post('/api/ob/reactions').send({ type: 'resonates' });
    expect(res.status).toBe(400);
  });

  it('returns 201 when adding reaction', async () => {
    vi.mocked(obReactionService.upsertObReaction).mockResolvedValue({
      id: 'r1',
      node_id: 'n1',
      user_id: 'user-react-1',
      type: 'resonates',
      note: null,
      created_at: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/ob/reactions')
      .send({ nodeId: 'n1', type: 'resonates' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('resonates');
  });
});
