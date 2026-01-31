/**
 * Vercel serverless function: runs the Express app for all /api/* routes.
 * All /api/* requests are rewritten to /api/catchall/:path* so this handler receives them.
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
 * Normalize req.url so Express sees /api/... (rewrite sends /api/catchall?x-path=:path*).
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let url = req.url ?? '/';
  const parsed = new URL(url, 'http://_');
  const pathSeg = parsed.searchParams.get('x-path');
  if (pathSeg !== null && pathSeg !== '') {
    const rest = new URLSearchParams(parsed.searchParams);
    rest.delete('x-path');
    const q = rest.toString();
    url = '/api/' + pathSeg + (q ? '?' + q : '');
  } else if (url.startsWith('/api/catchall')) {
    url = '/api' + url.slice('/api/catchall'.length);
  }
  if (!url.startsWith('/api')) {
    url = '/api' + (url.startsWith('/') ? url : `/${url}`);
  }
  req.url = url;
  const { default: app } = await getApp();
  app(req, res);
}
