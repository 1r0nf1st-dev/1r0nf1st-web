import { Router } from 'express';
import { supabase } from '../../db/supabase.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { runEnrichmentPipeline } from '../../services/obEnrichmentService.js';
import {
  listObNodes,
  getObNode,
  createObNode,
  updateObNode,
  deleteObNode,
  type ObNodeType,
  type ObVisibility,
  type ObNodeUpdate,
} from '../../services/obNodeService.js';
import { sanitizeFreeText, sanitizeFreeTextPreserveNewlines } from '../../utils/sanitize.js';
import { logger } from '../../utils/logger.js';

const obNodesRouter = Router();
obNodesRouter.use(authenticateToken);
obNodesRouter.use(requireAdmin);

const TITLE_MAX_LENGTH = 2000;
const BODY_MAX_LENGTH = 100_000;
const VALID_NODE_TYPES: ObNodeType[] = ['note', 'concept', 'question', 'source', 'project'];
const VALID_VISIBILITIES: ObVisibility[] = ['public', 'private', 'shared'];

function parseIdParam(id: string | string[] | undefined): string | null {
  if (id == null) return null;
  return Array.isArray(id) ? id[0] : id;
}

// List nodes for the authenticated user
obNodesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const limit = Math.min(Math.max(0, Number.parseInt(String(req.query.limit), 10) || 50), 100);
    const offset = Math.max(0, Number.parseInt(String(req.query.offset), 10) || 0);
    const node_type = req.query.node_type as ObNodeType | undefined;
    const visibility = req.query.visibility as ObVisibility | undefined;

    if (node_type && !VALID_NODE_TYPES.includes(node_type)) {
      res.status(400).json({ error: 'Invalid node_type' });
      return;
    }
    if (visibility && !VALID_VISIBILITIES.includes(visibility)) {
      res.status(400).json({ error: 'Invalid visibility' });
      return;
    }

    const nodes = await listObNodes(req.supabase, req.userId, {
      limit,
      offset,
      node_type,
      visibility,
    });
    res.json(nodes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch nodes';
    res.status(500).json({ error: message });
  }
});

// Get a single node
obNodesRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      res.status(503).json({ error: 'Database not configured' });
      return;
    }

    const id = parseIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Node id required' });
      return;
    }

    const node = await getObNode(req.supabase, id);
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    res.json(node);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch node';
    res.status(500).json({ error: message });
  }
});

// Create a node
obNodesRouter.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { title, body, node_type, visibility, source_url, linked_note_id, user_tags } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const nodeType =
      node_type && VALID_NODE_TYPES.includes(node_type as ObNodeType)
        ? (node_type as ObNodeType)
        : 'note';
    const vis =
      visibility && VALID_VISIBILITIES.includes(visibility as ObVisibility)
        ? (visibility as ObVisibility)
        : 'private';

    const node = await createObNode(req.supabase, {
      user_id: req.userId,
      title: sanitizeFreeText(title.trim(), TITLE_MAX_LENGTH),
      body:
        body != null && typeof body === 'string'
          ? sanitizeFreeTextPreserveNewlines(body, BODY_MAX_LENGTH)
          : null,
      node_type: nodeType,
      visibility: vis,
      source_url:
        source_url != null && typeof source_url === 'string'
          ? sanitizeFreeText(source_url, 2048)
          : null,
      linked_note_id:
        linked_note_id != null && linked_note_id !== '' ? String(linked_note_id) : null,
      user_tags: Array.isArray(user_tags) ? user_tags.map(String).slice(0, 50) : [],
    });

    const db = supabase;
    const uid = req.userId;
    if (db && uid) {
      setImmediate(() => {
        runEnrichmentPipeline(db, node.id, uid).catch((err) => {
          logger.warn({ err, nodeId: node.id }, 'OB enrichment failed after create');
        });
      });
    }

    res.status(201).json(node);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create node';
    res.status(500).json({ error: message });
  }
});

// Update a node
obNodesRouter.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = parseIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Node id required' });
      return;
    }

    const { title, body, node_type, visibility, source_url, linked_note_id, user_tags } = req.body;

    const update: ObNodeUpdate = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        res.status(400).json({ error: 'Title cannot be empty' });
        return;
      }
      update.title = sanitizeFreeText(title.trim(), TITLE_MAX_LENGTH);
    }
    if (body !== undefined) {
      update.body =
        body == null || body === ''
          ? null
          : sanitizeFreeTextPreserveNewlines(String(body), BODY_MAX_LENGTH);
    }
    if (node_type !== undefined) {
      if (!VALID_NODE_TYPES.includes(node_type as ObNodeType)) {
        res.status(400).json({ error: 'Invalid node_type' });
        return;
      }
      update.node_type = node_type as ObNodeType;
    }
    if (visibility !== undefined) {
      if (!VALID_VISIBILITIES.includes(visibility as ObVisibility)) {
        res.status(400).json({ error: 'Invalid visibility' });
        return;
      }
      update.visibility = visibility as ObVisibility;
    }
    if (source_url !== undefined) {
      update.source_url =
        source_url == null || source_url === '' ? null : sanitizeFreeText(String(source_url), 2048);
    }
    if (linked_note_id !== undefined) {
      update.linked_note_id =
        linked_note_id == null || linked_note_id === '' ? null : String(linked_note_id);
    }
    if (user_tags !== undefined) {
      update.user_tags = Array.isArray(user_tags) ? user_tags.map(String).slice(0, 50) : [];
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    const node = await updateObNode(req.supabase, id, req.userId, update);

    const db = supabase;
    const uid = req.userId;
    if (db && uid) {
      setImmediate(() => {
        runEnrichmentPipeline(db, id, uid).catch((err) => {
          logger.warn({ err, nodeId: id }, 'OB enrichment failed after update');
        });
      });
    }

    res.json(node);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update node';
    const status =
      error instanceof Error && message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

// Delete a node
obNodesRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = parseIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Node id required' });
      return;
    }

    await deleteObNode(req.supabase, id, req.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete node';
    const status =
      error instanceof Error && message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

export { obNodesRouter };
