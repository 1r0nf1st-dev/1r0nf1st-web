export const config = {
  port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001,
  githubToken: process.env.GITHUB_TOKEN,
  githubUsername: process.env.GITHUB_USERNAME,
  mediumFeedUrl: (() => {
    const url =
      process.env.MEDIUM_FEED_URL?.trim() ||
      (process.env.MEDIUM_USERNAME
        ? `https://medium.com/feed/@${process.env.MEDIUM_USERNAME.replace(/^@/, '').trim()}`
        : '');
    return url || '';
  })(),
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID?.trim() ?? '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET?.trim() ?? '',
  spotifyRefreshToken: process.env.SPOTIFY_REFRESH_TOKEN?.trim() ?? '',
  spotifyRedirectUri:
    process.env.SPOTIFY_REDIRECT_URI?.trim() ||
    `http://localhost:${process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001}/api/spotify/callback`,
  stravaClientId: process.env.STRAVA_CLIENT_ID?.trim() ?? '',
  stravaClientSecret: process.env.STRAVA_CLIENT_SECRET?.trim() ?? '',
  stravaRefreshToken: process.env.STRAVA_REFRESH_TOKEN?.trim() ?? '',
  stravaRedirectUri:
    process.env.STRAVA_REDIRECT_URI?.trim() ||
    `http://localhost:${process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001}/api/strava/callback`,
  publicApiBase: process.env.PUBLIC_API_BASE,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : undefined,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY?.trim() ?? '',
  vercelApiToken: process.env.VERCEL_API_TOKEN?.trim() ?? '',
  vercelProjectId: process.env.VERCEL_PROJECT_ID?.trim() ?? '',
  devToUsername: process.env.DEVTO_USERNAME?.trim() ?? '',
  devToTag: process.env.DEVTO_TAG?.trim() ?? '',
  devToSource: (process.env.DEVTO_SOURCE?.trim() ?? 'username') as
    | 'username'
    | 'tag'
    | 'latest'
    | 'top',
  logLevel: (process.env.LOG_LEVEL?.trim() ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')) as
    | 'fatal'
    | 'error'
    | 'warn'
    | 'info'
    | 'debug'
    | 'trace',
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING
    ? process.env.ENABLE_REQUEST_LOGGING.trim().toLowerCase() === 'true'
    : process.env.NODE_ENV === 'development',
  enableAnalytics: process.env.ENABLE_ANALYTICS
    ? process.env.ENABLE_ANALYTICS.trim().toLowerCase() === 'true'
    : false,
};
