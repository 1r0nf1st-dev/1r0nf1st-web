import crypto from 'crypto';
import { supabase } from '../db/supabase.js';

const TOKEN_BYTES = 32;
const TOKEN_PREFIX = 'nc_';

export interface WebClipperToken {
  id: string;
  user_id: string;
  created_at: string;
}

/**
 * Generate a new Web Clipper token for the user. Revokes any existing token.
 * Returns the raw token (shown once); store hash in DB.
 */
export async function createWebClipperToken(userId: string): Promise<{ token: string; createdAt: string }> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const rawToken = TOKEN_PREFIX + crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Delete existing token for user (one token per user)
  await supabase.from('web_clipper_tokens').delete().eq('user_id', userId);

  const { data, error } = await supabase
    .from('web_clipper_tokens')
    .insert({ user_id: userId, token_hash: tokenHash })
    .select('created_at')
    .single();

  if (error) {
    throw new Error(`Failed to create Web Clipper token: ${error.message}`);
  }

  return {
    token: rawToken,
    createdAt: (data as { created_at: string }).created_at,
  };
}

/**
 * Verify Web Clipper token and return user ID.
 */
export async function verifyWebClipperToken(rawToken: string): Promise<string | null> {
  if (!supabase || !rawToken || typeof rawToken !== 'string') {
    return null;
  }

  if (!rawToken.startsWith(TOKEN_PREFIX)) {
    return null;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const { data, error } = await supabase
    .from('web_clipper_tokens')
    .select('user_id')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as { user_id: string }).user_id;
}
