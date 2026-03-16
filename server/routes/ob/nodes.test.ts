import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { obNodesRouter } from './nodes.js';
import * as obNodeService from '../../services/obNodeService.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const r = req as express.Request & { userId: string; supabase?: unknown };
    r.userId = 'user-ob-1';
    r.supabase = {};
    next();
  },
}));

vi.mock('../../services/obNodeService.js');

function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/ob/nodes', obNodesRouter);
  return app;
}

describe('obNodesRouter', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /', () => {
    it('returns nodes for authenticated user', async () => {
      vi.mocked(obNodeService.listObNodes).mockResolvedValue([
        {
          id: 'n1',
          user_id: 'user-ob-1',
          title: 'My node',
          body: null,
          node_type: 'note',
          visibility: 'private',
          embedding: null,
          ai_summary: null,
          ai_tags: [],
          user_tags: [],
          source_url: null,
          linked_note_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const res = await request(app).get('/api/ob/nodes');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('My node');
      expect(obNodeService.listObNodes).toHaveBeenCalledWith(
        expect.anything(),
        'user-ob-1',
        expect.any(Object),
      );
    });
  });

  describe('POST /', () => {
    it('creates node and returns 201', async () => {
      vi.mocked(obNodeService.createObNode).mockResolvedValue({
        id: 'n-new',
        user_id: 'user-ob-1',
        title: 'New node',
        body: 'Body text',
        node_type: 'note',
        visibility: 'private',
        embedding: null,
        ai_summary: null,
        ai_tags: [],
        user_tags: [],
        source_url: null,
        linked_note_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/ob/nodes')
        .send({ title: 'New node', body: 'Body text' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New node');
      expect(obNodeService.createObNode).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          user_id: 'user-ob-1',
          title: 'New node',
          body: 'Body text',
        }),
      );
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/ob/nodes').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Title');
    });
  });

  describe('GET /:id', () => {
    it('returns 404 when node not found', async () => {
      vi.mocked(obNodeService.getObNode).mockResolvedValue(null);

      const res = await request(app).get('/api/ob/nodes/missing-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Node not found');
    });
  });

  describe('DELETE /:id', () => {
    it('returns 204 when node deleted', async () => {
      vi.mocked(obNodeService.deleteObNode).mockResolvedValue();

      const res = await request(app).delete('/api/ob/nodes/n1');
      expect(res.status).toBe(204);
      expect(obNodeService.deleteObNode).toHaveBeenCalledWith(
        expect.anything(),
        'n1',
        'user-ob-1',
      );
    });
  });
});
