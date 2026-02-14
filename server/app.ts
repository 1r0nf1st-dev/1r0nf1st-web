import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { githubRouter } from './routes/github.js';
import { mediumRouter } from './routes/medium.js';
import { spotifyRouter } from './routes/spotify.js';
import { stravaRouter } from './routes/strava.js';
import { weatherRouter } from './routes/weather.js';
import { quoteRouter } from './routes/quote.js';
import { jokeRouter } from './routes/joke.js';
import { vercelRouter } from './routes/vercel.js';
import { devtoRouter } from './routes/devto.js';
import { authRouter } from './routes/auth.js';
import { goalsRouter } from './routes/goals.js';
import { notesRouter } from './routes/notes.js';
import { logsRouter } from './routes/logs.js';
import { emailRouter } from './routes/email.js';
import { contactRouter } from './routes/contact.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorLogger } from './middleware/errorLogger.js';

// Validate required environment variables in production (skip on Vercel; env is set in dashboard)
if (config.nodeEnv === 'production' && !process.env.VERCEL) {
  const requiredVars: string[] = [];
  if (!config.supabaseUrl) {
    requiredVars.push('SUPABASE_URL');
  }
  if (!config.supabaseServiceRoleKey) {
    requiredVars.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!config.supabaseAnonKey) {
    requiredVars.push('SUPABASE_ANON_KEY');
  }
  if (requiredVars.length > 0) {
    logger.error(
      { missingVars: requiredVars },
      'Missing required environment variables for production',
    );
    process.exit(1);
  }
}

const app = express();

// Configure CORS based on environment
const corsOptions: cors.CorsOptions = {
  origin:
    config.nodeEnv === 'production' && config.allowedOrigins
      ? config.allowedOrigins
      : true, // Allow all origins in development
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware (must be after body parser, before routes)
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/github', githubRouter);
app.use('/api/medium', mediumRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/strava', stravaRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/quote', quoteRouter);
app.use('/api/joke', jokeRouter);
app.use('/api/vercel', vercelRouter);
app.use('/api/devto', devtoRouter);
app.use('/api/auth', authRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/logs', logsRouter);
app.use('/api/email', emailRouter);
app.use('/api/contact', contactRouter);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested API endpoint does not exist',
  });
});

// Error logging middleware (must be before error handler)
app.use(errorLogger);

// Global error handler middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    // Error is already logged by errorLogger middleware
    const statusCode = (err as Error & { status?: number }).status || 500;

    // Don't leak error details in production
    const message =
      config.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message || 'An unexpected error occurred';

    res.status(statusCode).json({
      error: statusCode >= 500 ? 'Internal Server Error' : 'Error',
      message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
  },
);

export default app;
