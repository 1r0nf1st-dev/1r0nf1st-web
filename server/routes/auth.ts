import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { supabase } from '../db/supabase.js';

export const authRouter = Router();

// Initialize default admin user if it doesn't exist (development only)
const ensureDefaultUser = async (): Promise<void> => {
  // Skip in production for security
  if (config.nodeEnv === 'production') {
    return;
  }

  if (!supabase) {
    if (config.nodeEnv === 'development') {
      console.warn('⚠️  Supabase not configured. Skipping default user creation.');
    }
    return;
  }

  try {
    // Check if admin user exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (!existingAdmin && supabase) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const { error } = await supabase.from('users').insert({
        username: 'admin',
        password_hash: hashedPassword,
      });

      if (error) {
        if (config.nodeEnv === 'development') {
          console.error('Error creating default admin user:', error);
        }
      } else if (config.nodeEnv === 'development') {
        console.log('Default admin user created (username: admin)');
      }
    }
  } catch (error) {
    if (config.nodeEnv === 'development') {
      console.error('Error ensuring default user:', error);
    }
  }
};

// Initialize default user on startup
ensureDefaultUser();

// Register endpoint
authRouter.post('/register', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured. Please set Supabase credentials.' });
    return;
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase
    const { data: newUser, error } = await supabase!
      .from('users')
      .insert({
        username,
        password_hash: hashedPassword,
      })
      .select('id, username')
      .single();

    if (error) {
      if (config.nodeEnv === 'development') {
        console.error('Database error:', error);
      }
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    if (!newUser) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      config.jwtSecret,
      { expiresIn: '7d' },
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
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
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find user in Supabase
    const { data: user, error } = await supabase!
      .from('users')
      .select('id, username, password_hash')
      .eq('username', username)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    if (config.nodeEnv === 'development') {
      console.error('Login error:', error);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
authRouter.get('/verify', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.userId,
      username: req.username,
    },
  });
});

// Protected route example
authRouter.get('/profile', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.userId,
      username: req.username,
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
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
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

    // Get user from database
    const { data: user, error: fetchError } = await supabase!
      .from('users')
      .select('id, username, password_hash')
      .eq('id', req.userId)
      .single();

    if (fetchError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const { error: updateError } = await supabase!
      .from('users')
      .update({ password_hash: hashedNewPassword })
      .eq('id', req.userId);

    if (updateError) {
      console.error('Database error updating password:', updateError);
      res.status(500).json({ error: 'Failed to update password' });
      return;
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (config.nodeEnv === 'development') {
      console.error('Change password error:', error);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
