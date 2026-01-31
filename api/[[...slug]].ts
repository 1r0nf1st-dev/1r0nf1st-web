/**
 * Vercel serverless function: runs the Express app for all /api/* routes.
 * Build the server first (pnpm build:server) so server/dist/app.js exists.
 */
import type { Request, Response } from 'express';
import app from '../server/dist/app.js';

/**
 * Normalize req.url so Express sees the full path including /api.
 * Vercel may pass the path without the /api prefix to the catch-all handler.
 */
function handler(req: Request, res: Response): void {
  const url = req.url ?? '/';
  if (!url.startsWith('/api')) {
    req.url = '/api' + (url.startsWith('/') ? url : `/${url}`);
  }
  app(req, res);
}

export default handler;
