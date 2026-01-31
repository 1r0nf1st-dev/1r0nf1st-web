import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { githubRouter } from './routes/github.js';
import { mediumRouter } from './routes/medium.js';
import { spotifyRouter } from './routes/spotify.js';
import { stravaRouter } from './routes/strava.js';
import { authRouter } from './routes/auth.js';
import { config } from './config.js';

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
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
    console.error('❌ Missing required environment variables for production:');
    requiredVars.forEach((v) => console.error(`   - ${v}`));
    console.error('\nPlease set all required environment variables before starting the server.');
    process.exit(1);
  }
}

const app = express();
const PORT = config.port || 3001;

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/github', githubRouter);
app.use('/api/medium', mediumRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/strava', stravaRouter);
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  if (config.nodeEnv === 'development') {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
  }
});
