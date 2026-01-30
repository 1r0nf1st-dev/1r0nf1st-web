export const config = {
  port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001,
  githubToken: process.env.GITHUB_TOKEN,
  githubUsername: process.env.GITHUB_USERNAME,
  publicApiBase: process.env.PUBLIC_API_BASE,
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : undefined,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
};
