import { Router } from 'express';
import { supabase } from '../../db/supabase.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticateToken } from '../../middleware/auth.js';
import {
  exploreObNodes,
  type ObNodeTypeFilter,
} from '../../services/obAiService.js';

const VALID_NODE_TYPES: ObNodeTypeFilter[] = [
  'note',
  'concept',
  'question',
  'source',
  'project',
];

const obExploreRouter = Router();
obExploreRouter.use(authenticateToken);

/**
 * POST /api/ob/explore
 * Body: { query: string, limit?: number, node_type?: ObNodeTypeFilter }
 * Cross-brain semantic search over all public nodes. Returns results with username and brain_slug.
 */
obExploreRouter.post('/', async (req: AuthRequest, res) => {
  try {
    if (!supabase) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const { query, limit, node_type: nodeType } = req.body as {
      query?: string;
      limit?: number;
      node_type?: string;
    };
    if (query == null || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const limitNum = Math.min(
      Math.max(1, Number.parseInt(String(limit), 10) || 20),
      50,
    );

    const filterType =
      nodeType != null &&
      typeof nodeType === 'string' &&
      VALID_NODE_TYPES.includes(nodeType as ObNodeTypeFilter)
        ? (nodeType as ObNodeTypeFilter)
        : undefined;

    const results = await exploreObNodes(
      supabase,
      query.trim(),
      limitNum,
      filterType,
    );
    res.json(results);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Explore search failed';
    res.status(500).json({ error: message });
  }
});

export { obExploreRouter };
