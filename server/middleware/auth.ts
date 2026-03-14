import type { Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createUserClient } from '../db/createUserClient.js';
import { supabase } from '../db/supabase.js';
import { verifyWebClipperToken } from '../services/webClipperService.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      username?: string;
    };
  };
  /** User-scoped Supabase client (RLS enforced). Set only when JWT auth succeeds. */
  supabase?: SupabaseClient;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  if (!supabase) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  try {
    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn(
        { authError: error?.message ?? String(error), hasUser: !!user },
        'Auth token rejected (403). Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY match the same project as NEXT_PUBLIC_SUPABASE_URL.',
      );
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user info and user-scoped Supabase client to request
    req.userId = user.id;
    req.email = user.email;
    req.user = user;
    req.supabase = createUserClient(token);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

/** Authenticate Web Clipper extension via Bearer token (nc_xxx). */
export const authenticateWebClipper = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Web Clipper token required' });
    return;
  }

  try {
    const userId = await verifyWebClipperToken(token);
    if (!userId) {
      res.status(403).json({ error: 'Invalid or expired Web Clipper token' });
      return;
    }
    req.userId = userId;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};
