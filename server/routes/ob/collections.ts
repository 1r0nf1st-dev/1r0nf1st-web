import { Router } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import {
  listObCollections,
  getObCollection,
  createObCollection,
  updateObCollection,
  deleteObCollection,
  addNodeToCollection,
  removeNodeFromCollection,
  listNodesInCollection,
} from '../../services/obCollectionService.js';
import type { ObVisibility } from '../../services/obNodeService.js';
import { sanitizeFreeText } from '../../utils/sanitize.js';

const obCollectionsRouter = Router();
obCollectionsRouter.use(authenticateToken);
obCollectionsRouter.use(requireAdmin);

const VALID_VISIBILITIES: ObVisibility[] = ['public', 'private', 'shared'];
const NAME_MAX_LENGTH = 500;
const DESCRIPTION_MAX_LENGTH = 2000;

function parseIdParam(id: string | string[] | undefined): string | null {
  if (id == null) return null;
  return Array.isArray(id) ? id[0] : id;
}

obCollectionsRouter.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const collections = await listObCollections(req.supabase, req.userId);
    res.json(collections);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list collections';
    res.status(500).json({ error: message });
  }
});

obCollectionsRouter.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const id = parseIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Collection id required' });
      return;
    }
    const collection = await getObCollection(req.supabase, id, req.userId);
    if (!collection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }
    res.json(collection);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get collection';
    res.status(500).json({ error: message });
  }
});

obCollectionsRouter.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const { name, description, visibility } = req.body as {
      name?: string;
      description?: string;
      visibility?: string;
    };
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const vis =
      visibility && VALID_VISIBILITIES.includes(visibility as ObVisibility)
        ? (visibility as ObVisibility)
        : 'private';
    const collection = await createObCollection(req.supabase, req.userId, {
      name: sanitizeFreeText(name.trim(), NAME_MAX_LENGTH),
      description:
        description != null && typeof description === 'string'
          ? sanitizeFreeText(description, DESCRIPTION_MAX_LENGTH)
          : null,
      visibility: vis,
    });
    res.status(201).json(collection);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create collection';
    res.status(500).json({ error: message });
  }
});

obCollectionsRouter.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const id = parseIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Collection id required' });
      return;
    }
    const { name, description, visibility, cover_node_id } = req.body as {
      name?: string;
      description?: string | null;
      visibility?: string;
      cover_node_id?: string | null;
    };
    const update: {
      name?: string;
      description?: string | null;
      visibility?: ObVisibility;
      cover_node_id?: string | null;
    } = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'name cannot be empty' });
        return;
      }
      update.name = sanitizeFreeText(name.trim(), NAME_MAX_LENGTH);
    }
    if (description !== undefined) {
      update.description =
        description == null || description === ''
          ? null
          : sanitizeFreeText(String(description), DESCRIPTION_MAX_LENGTH);
    }
    if (visibility !== undefined) {
      if (!VALID_VISIBILITIES.includes(visibility as ObVisibility)) {
        res.status(400).json({ error: 'Invalid visibility' });
        return;
      }
      update.visibility = visibility as ObVisibility;
    }
    if (cover_node_id !== undefined) {
      update.cover_node_id =
        cover_node_id == null || cover_node_id === '' ? null : String(cover_node_id);
    }
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }
    const collection = await updateObCollection(req.supabase, id, req.userId, update);
    res.json(collection);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update collection';
    const status =
      error instanceof Error && message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

obCollectionsRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const id = parseIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Collection id required' });
      return;
    }
    await deleteObCollection(req.supabase, id, req.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete collection';
    const status =
      error instanceof Error && message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

obCollectionsRouter.get('/:id/nodes', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const id = parseIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Collection id required' });
      return;
    }
    const collection = await getObCollection(req.supabase, id, req.userId);
    if (!collection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }
    const nodes = await listNodesInCollection(req.supabase, id);
    res.json(nodes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list nodes';
    res.status(500).json({ error: message });
  }
});

obCollectionsRouter.post('/:id/nodes', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const id = parseIdParam(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Collection id required' });
      return;
    }
    const { nodeId, position } = req.body as { nodeId?: string; position?: number };
    if (!nodeId || typeof nodeId !== 'string') {
      res.status(400).json({ error: 'nodeId is required' });
      return;
    }
    const pos = typeof position === 'number' ? position : 0;
    const row = await addNodeToCollection(req.supabase, id, nodeId, req.userId, pos);
    res.status(201).json(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add node';
    const status =
      error instanceof Error && message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

obCollectionsRouter.delete('/:id/nodes/:nodeId', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.supabase) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const id = parseIdParam(req.params.id);
    const nodeId = parseIdParam(req.params.nodeId);
    if (!id || !nodeId) {
      res.status(400).json({ error: 'Collection id and nodeId required' });
      return;
    }
    await removeNodeFromCollection(req.supabase, id, nodeId, req.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove node';
    const status =
      error instanceof Error && message.toLowerCase().includes('not found') ? 404 : 500;
    res.status(status).json({ error: message });
  }
});

export { obCollectionsRouter };
