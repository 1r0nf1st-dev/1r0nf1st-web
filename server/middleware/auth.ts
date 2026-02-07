import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase.js';

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
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user info to request
    req.userId = user.id;
    req.email = user.email;
    req.user = user;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};
