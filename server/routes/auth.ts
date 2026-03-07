import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../utils/logger.js';

export const authRouter = Router();

// Apply strict rate limiting to all auth routes
authRouter.use(authRateLimiter);

// ---------------------------------------------------------------------------
// NOTE: register, login, change-password, confirm-reset-password and
// forgot-password have been removed. All of these now go directly from the
// browser to the Supabase Auth API via the @supabase/supabase-js client SDK,
// so passwords never pass through this Express server.
// ---------------------------------------------------------------------------

// Verify token endpoint — used by AuthContext on startup to re-hydrate the
// user from an existing localStorage token.
authRouter.get('/verify', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.userId,
      email: req.email,
      username: req.user?.user_metadata?.username,
    },
  });
});

// Refresh token endpoint — kept as a server-side fallback; the Supabase client
// SDK also handles token refresh automatically.
authRouter.post('/refresh', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured. Please set Supabase credentials.' });
    return;
  }

  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      logger.warn(
        { refreshError: error?.message ?? String(error) },
        'Refresh token rejected (403). Ensure server SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY match the client project.',
      );
      res.status(403).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    logger.error({ error, path: '/refresh' }, 'Refresh token error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint — server-side session cleanup.
authRouter.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured. Please set Supabase credentials.' });
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await supabase.auth.signOut();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ error, path: '/logout', userId: req.userId }, 'Logout error');
    res.status(500).json({ error: 'Internal server error' });
  }
});
