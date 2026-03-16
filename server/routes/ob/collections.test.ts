import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { obCollectionsRouter } from './collections.js';
import * as obCollectionService from '../../services/obCollectionService.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const r = req as express.Request & { userId: string; supabase?: unknown };
    r.userId = 'user-coll-1';
    r.supabase = {};
    next();
  },
}));

vi.mock('../../services/obCollectionService.js');

function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/ob/collections', obCollectionsRouter);
  return app;
}

describe('obCollectionsRouter', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when creating collection without name', async () => {
    const res = await request(app).post('/api/ob/collections').send({});
    expect(res.status).toBe(400);
  });

  it('returns 201 when creating collection with name', async () => {
    vi.mocked(obCollectionService.createObCollection).mockResolvedValue({
      id: 'c1',
      user_id: 'user-coll-1',
      name: 'My collection',
      description: null,
      visibility: 'private',
      cover_node_id: null,
      created_at: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/ob/collections')
      .send({ name: 'My collection' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My collection');
  });

  it('returns list of collections', async () => {
    vi.mocked(obCollectionService.listObCollections).mockResolvedValue([]);
    const res = await request(app).get('/api/ob/collections');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
