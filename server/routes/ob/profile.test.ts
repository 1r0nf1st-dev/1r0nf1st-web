import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import * as obNodeService from '../../services/obNodeService.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const r = req as express.Request & { userId: string; email?: string; supabase: object };
    r.userId = 'user-ob-prof-1';
    r.email = 'admin@1r0nf1st.com';
    r.supabase = {};
    next();
  },
}));

vi.mock('../../middleware/requireAdmin.js', () => ({
  requireAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
}));

vi.mock('../../services/obNodeService.js');

const { obProfileRouter } = await import('./profile.js');

function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/ob/profile', obProfileRouter);
  return app;
}

describe('obProfileRouter', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /me', () => {
    it('returns 200 with profile when found on first fetch', async () => {
      vi.mocked(obNodeService.getObProfileByUserId).mockResolvedValueOnce({
        id: 'user-ob-prof-1',
        username: 'admin',
        display_name: null,
        brain_slug: 'admin',
        bio: null,
        settings: {},
        created_at: '2025-01-01T00:00:00Z',
      });

      const res = await request(app).get('/api/ob/profile/me');
      expect(res.status).toBe(200);
      expect(res.body.brain_slug).toBe('admin');
      expect(obNodeService.ensureObProfileRowForUser).not.toHaveBeenCalled();
    });

    it('calls ensure then returns profile when first fetch is null', async () => {
      vi.mocked(obNodeService.getObProfileByUserId)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'user-ob-prof-1',
          username: 'admin',
          display_name: null,
          brain_slug: 'admin',
          bio: null,
          settings: {},
          created_at: '2025-01-01T00:00:00Z',
        });
      vi.mocked(obNodeService.ensureObProfileRowForUser).mockResolvedValue(undefined);

      const res = await request(app).get('/api/ob/profile/me');
      expect(res.status).toBe(200);
      expect(obNodeService.ensureObProfileRowForUser).toHaveBeenCalledWith(
        'user-ob-prof-1',
        'admin@1r0nf1st.com',
      );
      expect(res.body.username).toBe('admin');
    });

    it('returns 404 when profile still missing after ensure', async () => {
      vi.mocked(obNodeService.getObProfileByUserId).mockResolvedValue(null);
      vi.mocked(obNodeService.ensureObProfileRowForUser).mockResolvedValue(undefined);

      const res = await request(app).get('/api/ob/profile/me');
      expect(res.status).toBe(404);
      expect(obNodeService.ensureObProfileRowForUser).toHaveBeenCalled();
    });
  });
});
