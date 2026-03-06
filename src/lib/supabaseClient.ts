import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Browser-side Supabase client using the public anon key.
 * Used for all client-side auth operations (signUp, signInWithPassword,
 * updateUser, signOut, resetPasswordForEmail) so that passwords never
 * pass through the Express server.
 *
 * The client is only instantiated when both env vars are present so that
 * importing this module in a test environment (where vars are absent) does
 * not throw. In that case this export will be `null` and callers must guard.
 * Tests should mock this module via vi.mock('../lib/supabaseClient').
 */
export const supabaseClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
