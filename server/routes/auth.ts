import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

export const authRouter = Router();

// Register endpoint
authRouter.post('/register', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured. Please set Supabase credentials.' });
    return;
  }

  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0], // Use email prefix as username if not provided
        },
      },
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (!data.user) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    // Get session token
    const session = data.session;
    if (!session) {
      // User needs to verify email (if email confirmation is enabled)
      res.status(201).json({
        message: 'User created. Please check your email to verify your account.',
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username,
        },
      });
      return;
    }

    res.status(201).json({
      token: session.access_token,
      refreshToken: session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username,
      },
    });
  } catch (error) {
    logger.error({ error, path: '/register' }, 'Registration error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
authRouter.post('/login', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured. Please set Supabase credentials.' });
    return;
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Surface helpful Supabase messages (e.g. "Email not confirmed") while keeping generic for invalid credentials
      const message =
        error.message === 'Email not confirmed'
          ? 'Please confirm your email address before signing in. Check your inbox for the confirmation link.'
          : error.message === 'Invalid login credentials'
            ? 'Invalid credentials'
            : error.message;
      res.status(401).json({ error: message });
      return;
    }

    if (!data.session || !data.user) {
      res.status(401).json({ error: 'Failed to create session' });
      return;
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username,
      },
    });
  } catch (error) {
    logger.error({ error, path: '/login' }, 'Login error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
authRouter.get('/verify', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.userId,
      email: req.email,
      username: req.user?.user_metadata?.username,
    },
  });
});

// Refresh token endpoint
authRouter.post('/refresh', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured. Please set Supabase credentials.' });
    return;
  }

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
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

// Protected route example
authRouter.get('/profile', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.userId,
      email: req.email,
      username: req.user?.user_metadata?.username,
    },
  });
});

// Change password endpoint (protected)
authRouter.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured. Please set Supabase credentials.' });
    return;
  }

  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      res.status(400).json({ error: 'New password is required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Update password using Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error({ error, path: '/change-password', userId: req.userId }, 'Change password error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (optional - mainly for server-side session cleanup)
authRouter.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured. Please set Supabase credentials.' });
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Sign out the user
      await supabase.auth.signOut();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ error, path: '/logout', userId: req.userId }, 'Logout error');
    res.status(500).json({ error: 'Internal server error' });
  }
});
