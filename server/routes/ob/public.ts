import { Router } from 'express';
import { supabase } from '../../db/supabase.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import {
  getObProfileByBrainSlug,
  listPublicObNodesForOwner,
} from '../../services/obNodeService.js';
import { listObEdgesForNodeIds } from '../../services/obEdgeService.js';

const obPublicRouter = Router();
obPublicRouter.use(authenticateToken);
obPublicRouter.use(requireAdmin);

/** Safe slug: alphanumeric, hyphen, underscore only (max 100 chars). */
const SLUG_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;

/**
 * GET /api/ob/public/:brainSlug
 * Returns public profile and public nodes for a brain. Auth + admin only.
 */
obPublicRouter.get('/:brainSlug', async (req, res) => {
  try {
    if (!supabase) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const slug =
      typeof req.params.brainSlug === 'string'
        ? req.params.brainSlug
        : Array.isArray(req.params.brainSlug)
          ? req.params.brainSlug[0]
          : '';
    if (!slug || !SLUG_REGEX.test(slug)) {
      res.status(400).json({ error: 'Invalid brain slug' });
      return;
    }

    const profile = await getObProfileByBrainSlug(supabase, slug);
    if (!profile) {
      res.status(404).json({ error: 'Brain not found' });
      return;
    }

    const limit = Math.min(
      Math.max(0, Number.parseInt(String(req.query.limit), 10) || 50),
      100,
    );
    const offset = Math.max(0, Number.parseInt(String(req.query.offset), 10) || 0);

    const nodes = await listPublicObNodesForOwner(supabase, profile.id, {
      limit,
      offset,
    });

    const nodeIds = nodes.map((n) => n.id);
    const edges = await listObEdgesForNodeIds(supabase, nodeIds);

    res.json({
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        brain_slug: profile.brain_slug,
        bio: profile.bio,
      },
      nodes,
      edges: edges.map((e) => ({
        id: e.id,
        from_node_id: e.from_node_id,
        to_node_id: e.to_node_id,
        edge_type: e.edge_type,
        created_by: e.created_by,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load public brain';
    res.status(500).json({ error: message });
  }
});

export { obPublicRouter };
