import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { obEdgesRouter } from './edges.js';
import * as obEdgeService from '../../services/obEdgeService.js';
import * as obNodeService from '../../services/obNodeService.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const r = req as express.Request & { userId: string; supabase?: unknown };
    r.userId = 'user-edges-1';
    r.supabase = {};
    next();
  },
}));

vi.mock('../../services/obEdgeService.js');
vi.mock('../../services/obNodeService.js');

function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/ob/edges', obEdgesRouter);
  return app;
}

describe('obEdgesRouter', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when creating edge without fromNodeId', async () => {
    const res = await request(app)
      .post('/api/ob/edges')
      .send({ toNodeId: 'n2' });
    expect(res.status).toBe(400);
  });

  it('returns 201 when creating edge from own node', async () => {
    vi.mocked(obNodeService.getObNode).mockResolvedValue({
      id: 'n1',
      user_id: 'user-edges-1',
    } as never);
    vi.mocked(obEdgeService.createObEdge).mockResolvedValue({
      id: 'e1',
      from_node_id: 'n1',
      to_node_id: 'n2',
      edge_type: 'references',
      created_by: 'user',
      weight: 1,
      created_at: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/ob/edges')
      .send({ fromNodeId: 'n1', toNodeId: 'n2' });
    expect(res.status).toBe(201);
    expect(res.body.edge_type).toBe('references');
  });
});
