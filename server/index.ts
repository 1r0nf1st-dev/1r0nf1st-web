import app from './app.js';
import { config } from './config.js';

// On Vercel, the app is used as a serverless function; don't listen.
if (!process.env.VERCEL) {
  const PORT = config.port || 3001;
  app.listen(PORT, () => {
    if (config.nodeEnv === 'development') {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
    }
  });
}
