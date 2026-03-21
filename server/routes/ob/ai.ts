import { Router } from 'express';
import { supabase } from '../../db/supabase.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import {
  searchObNodes,
  chatWithBrain,
  expandNode,
  synthesizeNodes,
} from '../../services/obAiService.js';

const obAiRouter = Router();
obAiRouter.use(authenticateToken);
obAiRouter.use(requireAdmin);

/** POST /api/ob/ai/search — semantic search over ob_nodes */
obAiRouter.post('/search', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    if (!supabase) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const { query, brainOwnerId, limit } = req.body as {
      query?: string;
      brainOwnerId?: string;
      limit?: number;
    };

    if (query == null || typeof query !== 'string') {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const ownerId = brainOwnerId && typeof brainOwnerId === 'string' ? brainOwnerId : req.userId;
    const limitNum = limit != null ? Math.min(Math.max(1, Number(limit)), 50) : 15;

    const results = await searchObNodes(supabase, query, ownerId, limitNum);
    res.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    res.status(500).json({ error: message });
  }
});

/** POST /api/ob/ai/chat — RAG chat with a brain */
obAiRouter.post('/chat', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    if (!supabase) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const { query, brainOwnerId, history } = req.body as {
      query?: string;
      brainOwnerId?: string;
      history?: Array<{ role: string; content: string }>;
    };

    if (query == null || typeof query !== 'string') {
      res.status(400).json({ error: 'query is required' });
      return;
    }
    if (!brainOwnerId || typeof brainOwnerId !== 'string') {
      res.status(400).json({ error: 'brainOwnerId is required' });
      return;
    }

    let username: string | undefined;
    const { data: profile } = await supabase
      .from('ob_profiles')
      .select('username, display_name')
      .eq('id', brainOwnerId)
      .single();
    if (profile) {
      username =
        (profile as { display_name?: string }).display_name ||
        (profile as { username?: string }).username;
    }

    const { response, citedNodeIds } = await chatWithBrain(
      supabase,
      query,
      brainOwnerId,
      req.userId,
      { history, username },
    );

    res.json({ response, citedNodeIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat failed';
    res.status(500).json({ error: message });
  }
});

/** POST /api/ob/ai/expand — expand a node with questions, counter-arguments, related directions */
obAiRouter.post('/expand', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    if (!supabase) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const { nodeId } = req.body as { nodeId?: string };
    if (!nodeId || typeof nodeId !== 'string') {
      res.status(400).json({ error: 'nodeId is required' });
      return;
    }

    const result = await expandNode(supabase, nodeId, req.userId);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Expand failed';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

/** POST /api/ob/ai/synthesize — narrative connecting nodes */
obAiRouter.post('/synthesize', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    if (!supabase) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const { topic, nodeIds } = req.body as { topic?: string; nodeIds?: string[] };
    if (!topic || typeof topic !== 'string') {
      res.status(400).json({ error: 'topic is required' });
      return;
    }
    const ids = Array.isArray(nodeIds) ? nodeIds.filter((id) => typeof id === 'string') : [];

    const result = await synthesizeNodes(supabase, topic, ids, req.userId);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synthesize failed';
    res.status(500).json({ error: message });
  }
});

export { obAiRouter };
