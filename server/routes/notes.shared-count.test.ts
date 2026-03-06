import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  getSharedNotesCountMock: vi.fn(),
}));

vi.mock('../middleware/auth.js', () => ({
  authenticateToken: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const auth = req.headers.authorization;
    if (!auth) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }
    (req as express.Request & { userId?: string }).userId = 'test-user';
    next();
  },
  authenticateWebClipper: (
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(401).json({ error: 'Web Clipper token required' });
  },
}));

vi.mock('../services/noteService.js', async () => {
  const actual = await vi.importActual<typeof import('../services/noteService.js')>(
    '../services/noteService.js',
  );
  return {
    ...actual,
    getSharedNotesCount: mocks.getSharedNotesCountMock,
  };
});

import { notesRouter } from './notes.js';

function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/notes', notesRouter);
  return app;
}

describe('GET /notes/shared/count', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/notes/shared/count');
    expect(res.status).toBe(401);
  });

  it('returns shared count payload', async () => {
    mocks.getSharedNotesCountMock.mockResolvedValue(5);
    const res = await request(app)
      .get('/notes/shared/count')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { count: 5 }, error: null });
  });

  it('returns COUNT_FAILED on errors', async () => {
    mocks.getSharedNotesCountMock.mockRejectedValue(new Error('boom'));
    const res = await request(app)
      .get('/notes/shared/count')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      data: null,
      error: { code: 'COUNT_FAILED' },
    });
  });
});
