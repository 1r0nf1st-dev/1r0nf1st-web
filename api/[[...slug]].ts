/**
 * Vercel serverless function: runs the Express app for all /api/* routes.
 * Loads app from server/dist (built by pnpm build:server); includeFiles in vercel.json required.
 */
import path from 'path';
import { pathToFileURL } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';

let appPromise: Promise<{ default: (req: IncomingMessage, res: ServerResponse) => void }> | null =
  null;

function getApp() {
  if (!appPromise) {
    const appPath = path.join(process.cwd(), 'server', 'dist', 'app.js');
    appPromise = import(pathToFileURL(appPath).href);
  }
  return appPromise;
}

/**
 * Normalize req.url so Express sees the full path including /api.
 * Vercel may pass the path without the /api prefix to the catch-all handler.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = req.url ?? '/';
  if (!url.startsWith('/api')) {
    req.url = '/api' + (url.startsWith('/') ? url : `/${url}`);
  }
  const { default: app } = await getApp();
  app(req, res);
}
