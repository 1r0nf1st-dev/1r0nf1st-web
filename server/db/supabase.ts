import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

// Create Supabase client with service role key (for server-side operations)
// Only create client if credentials are provided
let supabase: SupabaseClient | null = null;

if (config.supabaseUrl && config.supabaseServiceRoleKey) {
  supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  logger.warn(
    'Supabase credentials are missing. Authentication features will not work. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.',
  );
}

export { supabase };

// User type from Supabase Auth
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    username?: string;
  };
}
