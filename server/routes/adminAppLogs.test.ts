import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { adminAppLogsRouter } from './adminAppLogs.js';

vi.mock('../middleware/auth.js', () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    (req as { email?: string }).email = 'admin@1r0nf1st.com';
    next();
  },
}));

vi.mock('../middleware/requireAdmin.js', () => ({
  requireAdmin: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../db/supabase.js', () => ({
  supabase: null,
}));

describe('adminAppLogsRouter', () => {
  it('returns 503 for summary when database is not configured', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/admin/app-logs', adminAppLogsRouter);

    const res = await request(app).get('/api/admin/app-logs/summary').expect(503);

    expect(res.body).toMatchObject({ error: 'Database not configured' });
  });
});
