import { Router } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { generateObDigest } from '../../services/obAiService.js';

const obDigestRouter = Router();
obDigestRouter.use(authenticateToken);
obDigestRouter.use(requireAdmin);

/**
 * GET /api/ob/digest
 * Returns an AI-generated weekly digest: last 7 days of ob_nodes + recent sb_thoughts (not routed), summarized via Gemini. Admin only.
 */
obDigestRouter.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const digest = await generateObDigest(req.supabase, req.userId);
    res.json({ digest });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate digest';
    res.status(500).json({ error: message });
  }
});

export { obDigestRouter };
