import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { obAiRouter } from './ai.js';
import * as obAiService from '../../services/obAiService.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const r = req as express.Request & { userId: string };
    r.userId = 'user-ai-1';
    next();
  },
}));

vi.mock('../../services/obAiService.js');
vi.mock('../../db/supabase.js', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null }),
        }),
      }),
    }),
  },
}));

function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/ob/ai', obAiRouter);
  return app;
}

describe('obAiRouter', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /search', () => {
    it('returns 400 when query is missing', async () => {
      const res = await request(app).post('/api/ob/ai/search').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('query');
    });

    it('returns search results when query provided', async () => {
      vi.mocked(obAiService.searchObNodes).mockResolvedValue([
        {
          id: 'n1',
          title: 'A node',
          body: null,
          node_type: 'note',
          ai_summary: null,
          ai_tags: [],
          user_tags: [],
          user_id: 'user-ai-1',
          similarity: 0.9,
        },
      ]);

      const res = await request(app)
        .post('/api/ob/ai/search')
        .send({ query: 'test' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('A node');
    });
  });

  describe('POST /chat', () => {
    it('returns 400 when query is missing', async () => {
      const res = await request(app).post('/api/ob/ai/chat').send({ brainOwnerId: 'owner-1' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when brainOwnerId is missing', async () => {
      const res = await request(app).post('/api/ob/ai/chat').send({ query: 'hello' });
      expect(res.status).toBe(400);
    });

    it('returns response and citedNodeIds when valid', async () => {
      vi.mocked(obAiService.chatWithBrain).mockResolvedValue({
        response: 'Here is the answer.',
        citedNodeIds: ['id1', 'id2'],
      });

      const res = await request(app)
        .post('/api/ob/ai/chat')
        .send({ query: 'hello', brainOwnerId: 'owner-1' });
      expect(res.status).toBe(200);
      expect(res.body.response).toBe('Here is the answer.');
      expect(res.body.citedNodeIds).toEqual(['id1', 'id2']);
    });
  });

  describe('POST /expand', () => {
    it('returns 400 when nodeId is missing', async () => {
      const res = await request(app).post('/api/ob/ai/expand').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /synthesize', () => {
    it('returns 400 when topic is missing', async () => {
      const res = await request(app).post('/api/ob/ai/synthesize').send({ nodeIds: [] });
      expect(res.status).toBe(400);
    });
  });
});
