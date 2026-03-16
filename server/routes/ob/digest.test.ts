import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { obDigestRouter } from './digest.js';
import * as obAiService from '../../services/obAiService.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const r = req as express.Request & { userId: string; supabase?: unknown };
    r.userId = 'user-digest-1';
    r.supabase = {};
    next();
  },
}));

vi.mock('../../middleware/requireAdmin.js', () => ({
  requireAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    next();
  },
}));

vi.mock('../../services/obAiService.js');

function createApp(): express.Application {
  const app = express();
  app.use('/api/ob/digest', obDigestRouter);
  return app;
}

describe('obDigestRouter', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and digest when generateObDigest succeeds', async () => {
    vi.mocked(obAiService.generateObDigest).mockResolvedValue('Your weekly digest: themes and connections.');
    const res = await request(app).get('/api/ob/digest');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('digest', 'Your weekly digest: themes and connections.');
    expect(obAiService.generateObDigest).toHaveBeenCalledWith(
      expect.anything(),
      'user-digest-1',
    );
  });
});
