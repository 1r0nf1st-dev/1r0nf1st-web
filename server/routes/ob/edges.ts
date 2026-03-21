import { Router } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import {
  listObEdges,
  createObEdge,
  deleteObEdge,
  getObEdge,
  type ObEdgeType,
} from '../../services/obEdgeService.js';
import { getObNode } from '../../services/obNodeService.js';

const obEdgesRouter = Router();
obEdgesRouter.use(authenticateToken);
obEdgesRouter.use(requireAdmin);

const VALID_EDGE_TYPES: ObEdgeType[] = [
  'supports',
  'contradicts',
  'extends',
  'inspired_by',
  'references',
];

function parseIdParam(id: string | string[] | undefined): string | null {
  if (id == null) return null;
  return Array.isArray(id) ? id[0] : id;
}

obEdgesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }
    const fromNodeId = typeof req.query.fromNodeId === 'string' ? req.query.fromNodeId : undefined;
    const toNodeId = typeof req.query.toNodeId === 'string' ? req.query.toNodeId : undefined;
    const edges = await listObEdges(req.supabase, { fromNodeId, toNodeId });
    res.json(edges);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list edges';
    res.status(500).json({ error: message });
  }
});

obEdgesRouter.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const { fromNodeId, toNodeId, edgeType, weight } = req.body as {
      fromNodeId?: string;
      toNodeId?: string;
      edgeType?: string;
      weight?: number;
    };
    if (!fromNodeId || !toNodeId) {
      res.status(400).json({ error: 'fromNodeId and toNodeId are required' });
      return;
    }
    const type =
      edgeType && VALID_EDGE_TYPES.includes(edgeType as ObEdgeType)
        ? (edgeType as ObEdgeType)
        : 'references';

    const fromNode = await getObNode(req.supabase, fromNodeId);
    if (!fromNode || fromNode.user_id !== req.userId) {
      res.status(403).json({ error: 'You can only create edges from your own nodes' });
      return;
    }

    const edge = await createObEdge(
      req.supabase,
      fromNodeId,
      toNodeId,
      type,
      'user',
      typeof weight === 'number' ? Math.min(1, Math.max(0, weight)) : 1,
    );
    res.status(201).json(edge);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create edge';
    res.status(500).json({ error: message });
  }
});

obEdgesRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const id = parseIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Edge id required' });
      return;
    }
    const edge = await getObEdge(req.supabase, id);
    if (!edge) {
      res.status(404).json({ error: 'Edge not found' });
      return;
    }
    const fromNode = await getObNode(req.supabase, edge.from_node_id);
    if (!fromNode || fromNode.user_id !== req.userId) {
      res.status(403).json({ error: 'You can only delete edges from your own nodes' });
      return;
    }
    await deleteObEdge(req.supabase, id);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete edge';
    res.status(500).json({ error: message });
  }
});

export { obEdgesRouter };
