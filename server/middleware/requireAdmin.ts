import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';

const ADMIN_EMAIL = 'admin@1r0nf1st.com';

/**
 * Restricts access to the admin user only (same as Second Brain).
 * Must be used after authenticateToken so req.email is set.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const email = req.email?.toLowerCase().trim();
  if (email !== ADMIN_EMAIL.toLowerCase()) {
    res.status(403).json({
      error: 'Admin only',
      message: 'Open Brain is available to admin users only.',
    });
    return;
  }
  next();
}
