import app from './app.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

// On Vercel, the app is used as a serverless function; don't listen.
if (!process.env.VERCEL) {
  const PORT = config.port || 3001;
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'API server started');
  });
}
