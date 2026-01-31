/**
 * Vercel serverless function: runs the Express app for all /api/* routes.
 * Build the server first (pnpm build:server) so server/dist/app.js exists.
 */
import app from '../server/dist/app.js';

export default app;
