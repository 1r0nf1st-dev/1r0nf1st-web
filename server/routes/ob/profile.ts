import { Router } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { getObProfileByUserId } from '../../services/obNodeService.js';

const obProfileRouter = Router();
obProfileRouter.use(authenticateToken);
obProfileRouter.use(requireAdmin);

/**
 * GET /api/ob/profile/me
 * Returns the current user's ob_profile (brain_slug, username, display_name). Admin only.
 */
obProfileRouter.get('/me', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const profile = await getObProfileByUserId(req.supabase, req.userId);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      brain_slug: profile.brain_slug,
      bio: profile.bio,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    res.status(500).json({ error: message });
  }
});

export { obProfileRouter };
