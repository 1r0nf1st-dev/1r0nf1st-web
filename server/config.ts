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
};
