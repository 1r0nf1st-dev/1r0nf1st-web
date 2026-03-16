import { Router } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import {
  listObReactionsByNode,
  upsertObReaction,
  deleteObReaction,
  type ObReactionType,
} from '../../services/obReactionService.js';
import { sanitizeFreeText } from '../../utils/sanitize.js';

const obReactionsRouter = Router();
obReactionsRouter.use(authenticateToken);
obReactionsRouter.use(requireAdmin);

const VALID_REACTION_TYPES: ObReactionType[] = [
  'resonates',
  'challenges',
  'expands',
  'bookmarks',
];
const NOTE_MAX_LENGTH = 1000;

obReactionsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }
    const nodeId =
      typeof req.query.nodeId === 'string' ? req.query.nodeId : undefined;
    if (!nodeId) {
      res.status(400).json({ error: 'nodeId query is required' });
      return;
    }
    const reactions = await listObReactionsByNode(req.supabase, nodeId);
    res.json(reactions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list reactions';
    res.status(500).json({ error: message });
  }
});

obReactionsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const { nodeId, type, note } = req.body as {
      nodeId?: string;
      type?: string;
      note?: string;
    };
    if (!nodeId || typeof nodeId !== 'string') {
      res.status(400).json({ error: 'nodeId is required' });
      return;
    }
    if (!type || !VALID_REACTION_TYPES.includes(type as ObReactionType)) {
      res.status(400).json({
        error: `type is required and must be one of: ${VALID_REACTION_TYPES.join(', ')}`,
      });
      return;
    }
    const reaction = await upsertObReaction(
      req.supabase,
      nodeId,
      req.userId,
      type as ObReactionType,
      note != null && typeof note === 'string'
        ? sanitizeFreeText(note, NOTE_MAX_LENGTH)
        : null,
    );
    res.status(201).json(reaction);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add reaction';
    res.status(500).json({ error: message });
  }
});

obReactionsRouter.delete('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const nodeId =
      typeof req.query.nodeId === 'string' ? req.query.nodeId : undefined;
    const type =
      typeof req.query.type === 'string' ? req.query.type : undefined;
    if (!nodeId || !type) {
      res.status(400).json({ error: 'nodeId and type query params are required' });
      return;
    }
    if (!VALID_REACTION_TYPES.includes(type as ObReactionType)) {
      res.status(400).json({ error: 'Invalid type' });
      return;
    }
    await deleteObReaction(req.supabase, nodeId, req.userId, type as ObReactionType);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete reaction';
    res.status(500).json({ error: message });
  }
});

export { obReactionsRouter };
