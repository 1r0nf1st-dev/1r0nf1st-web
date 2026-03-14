import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  captureThought,
  semanticSearch,
  queryWithRag,
  listProjects,
  listPeople,
  listIdeas,
  listAdmin,
  listResources,
  listThoughts,
  updateThought,
  updateProject,
  updateAdmin,
  updateIdea,
  routeThought,
  deleteThought,
  getDigestData,
  getReviewData,
  generateMorningDigest,
  generateWeeklyReview,
  backfillSecondBrainEmbeddings,
} from '../services/secondBrainService.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { sanitizeFreeText } from '../utils/sanitize.js';

const secondBrainRouter = Router();
const ADMIN_EMAIL = 'admin@1r0nf1st.com';

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const email = req.email?.toLowerCase().trim();
  if (email !== ADMIN_EMAIL) {
    res.status(403).json({
      error: 'Admin only',
      message: 'Second Brain is available to admin users only.',
    });
    return;
  }
  next();
}

function requireGemini(
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!config.geminiApiKey) {
    res.status(503).json({
      error: 'AI not configured',
      message: 'GEMINI_API_KEY is not configured for Second Brain.',
    });
    return;
  }
  next();
}

secondBrainRouter.use(authenticateToken);
secondBrainRouter.use(requireAdmin);

/** POST /api/second-brain/capture — in-app capture */
secondBrainRouter.post(
  '/capture',
  requireGemini,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const rawText =
        typeof req.body?.rawText === 'string' ? req.body.rawText : '';
      // #region agent log
      fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrain.ts:capture',message:'Capture route entered',data:{rawTextLen:rawText.length,hasRawText:!!rawText?.trim()},hypothesisId:'H1',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (!rawText.trim()) {
        res.status(400).json({ error: 'rawText is required' });
        return;
      }
      const result = await captureThought(
        sanitizeFreeText(rawText, 10000),
        'web',
      );
      // #region agent log
      fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrain.ts:capture',message:'Capture route success',data:{thoughtId:result.thoughtId,category:result.category,routed:result.routed},hypothesisId:'H1',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      res.status(201).json(result);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrain.ts:capture',message:'Capture route error',data:{errMsg:err instanceof Error?err.message:'unknown'},hypothesisId:'H1',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const message =
        err instanceof Error ? err.message : 'Failed to capture thought';
      res.status(500).json({ error: message });
    }
  },
);

/** POST /api/second-brain/search — semantic search */
secondBrainRouter.post(
  '/search',
  requireGemini,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const query =
        typeof req.body?.query === 'string' ? req.body.query : '';
      const threshold =
        typeof req.body?.matchThreshold === 'number'
          ? req.body.matchThreshold
          : 0.7;
      const limit =
        typeof req.body?.matchCount === 'number'
          ? Math.min(req.body.matchCount, 20)
          : 10;
      if (!query.trim()) {
        res.status(400).json({ error: 'query is required' });
        return;
      }
      let results: Awaited<ReturnType<typeof semanticSearch>> = [];
      try {
        results = await semanticSearch(
          sanitizeFreeText(query, 2000),
          threshold,
          limit,
        );
      } catch (err) {
        logger.warn({ err }, 'Semantic search failed, returning empty');
        // Return empty so UI shows "No matches" instead of 500
      }
      res.json(results);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Search failed';
      logger.warn({ err }, 'Second brain search failed');
      res.status(500).json({ error: message });
    }
  },
);

/** POST /api/second-brain/query — RAG Q&A */
secondBrainRouter.post(
  '/query',
  requireGemini,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const question =
        typeof req.body?.question === 'string' ? req.body.question : '';
      if (!question.trim()) {
        res.status(400).json({ error: 'question is required' });
        return;
      }
      const answer = await queryWithRag(
        sanitizeFreeText(question, 2000),
        5,
      );
      res.json({ answer });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Query failed';
      logger.warn({ err }, 'Second brain query failed');
      res.status(500).json({ error: message });
    }
  },
);

/** GET /api/second-brain/projects */
secondBrainRouter.get('/projects', async (req, res): Promise<void> => {
  try {
    const limit = Number(req.query?.limit) || 50;
    const data = await listProjects(limit);
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to list projects';
    res.status(500).json({ error: message });
  }
});

/** GET /api/second-brain/people */
secondBrainRouter.get('/people', async (req, res) => {
  try {
    const limit = Number(req.query?.limit) || 50;
    const data = await listPeople(limit);
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to list people';
    res.status(500).json({ error: message });
  }
});

/** GET /api/second-brain/ideas */
secondBrainRouter.get('/ideas', async (req, res) => {
  try {
    const limit = Number(req.query?.limit) || 50;
    const data = await listIdeas(limit);
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to list ideas';
    res.status(500).json({ error: message });
  }
});

/** GET /api/second-brain/admin */
secondBrainRouter.get('/admin', async (req, res) => {
  try {
    const limit = Number(req.query?.limit) || 50;
    const data = await listAdmin(limit);
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to list admin tasks';
    res.status(500).json({ error: message });
  }
});

/** GET /api/second-brain/resources */
secondBrainRouter.get('/resources', async (req, res) => {
  try {
    const limit = Number(req.query?.limit) || 50;
    const data = await listResources(limit);
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to list resources';
    res.status(500).json({ error: message });
  }
});

/** GET /api/second-brain/thoughts */
secondBrainRouter.get('/thoughts', async (req, res) => {
  try {
    const limit = Number(req.query?.limit) || 50;
    const data = await listThoughts(limit);
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to list thoughts';
    res.status(500).json({ error: message });
  }
});

function parseId(req: AuthRequest): string | null {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  return typeof id === 'string' && id ? id : null;
}

const parseThoughtId = parseId;

/** PATCH /api/second-brain/projects/:id */
secondBrainRouter.patch(
  '/projects/:id',
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const id = parseId(req);
      if (!id) {
        res.status(400).json({ error: 'Invalid project ID' });
        return;
      }
      const status =
        typeof req.body?.status === 'string' &&
        ['active', 'paused', 'done'].includes(req.body.status)
          ? req.body.status
          : undefined;
      const name = typeof req.body?.name === 'string' ? req.body.name : undefined;
      const goal = typeof req.body?.goal === 'string' ? req.body.goal : undefined;
      const next_action =
        typeof req.body?.next_action === 'string'
          ? req.body.next_action
          : undefined;
      const due_date =
        req.body?.due_date === null || typeof req.body?.due_date === 'string'
          ? req.body.due_date
          : undefined;
      const area =
        req.body?.area === null || typeof req.body?.area === 'string'
          ? req.body.area
          : undefined;
      const notes =
        req.body?.notes === null || typeof req.body?.notes === 'string'
          ? req.body.notes
          : undefined;
      if (
        status === undefined &&
        name === undefined &&
        goal === undefined &&
        next_action === undefined &&
        due_date === undefined &&
        area === undefined &&
        notes === undefined
      ) {
        res.status(400).json({
          error:
            'At least one of status, name, goal, next_action, due_date, area, notes is required',
        });
        return;
      }
      const result = await updateProject(id, {
        status,
        name,
        goal,
        next_action,
        due_date,
        area,
        notes,
      });
      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update project';
      res.status(500).json({ error: message });
    }
  },
);

/** PATCH /api/second-brain/admin/:id */
secondBrainRouter.patch(
  '/admin/:id',
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const id = parseId(req);
      if (!id) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }
      const status =
        typeof req.body?.status === 'string' &&
        ['pending', 'done'].includes(req.body.status)
          ? req.body.status
          : undefined;
      const task = typeof req.body?.task === 'string' ? req.body.task : undefined;
      const due_date =
        req.body?.due_date === null || typeof req.body?.due_date === 'string'
          ? req.body.due_date
          : undefined;
      const notes =
        req.body?.notes === null || typeof req.body?.notes === 'string'
          ? req.body.notes
          : undefined;
      if (
        status === undefined &&
        task === undefined &&
        due_date === undefined &&
        notes === undefined
      ) {
        res.status(400).json({
          error: 'At least one of status, task, due_date, notes is required',
        });
        return;
      }
      const result = await updateAdmin(id, { status, task, due_date, notes });
      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update task';
      res.status(500).json({ error: message });
    }
  },
);

/** PATCH /api/second-brain/ideas/:id */
secondBrainRouter.patch(
  '/ideas/:id',
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const id = parseId(req);
      if (!id) {
        res.status(400).json({ error: 'Invalid idea ID' });
        return;
      }
      const status =
        typeof req.body?.status === 'string' &&
        ['raw', 'developing', 'done'].includes(req.body.status)
          ? req.body.status
          : undefined;
      const title =
        typeof req.body?.title === 'string' ? req.body.title : undefined;
      const body =
        req.body?.body === null || typeof req.body?.body === 'string'
          ? req.body.body
          : undefined;
      const area =
        req.body?.area === null || typeof req.body?.area === 'string'
          ? req.body.area
          : undefined;
      if (
        status === undefined &&
        title === undefined &&
        body === undefined &&
        area === undefined
      ) {
        res.status(400).json({
          error: 'At least one of status, title, body, area is required',
        });
        return;
      }
      const result = await updateIdea(id, { status, title, body, area });
      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update idea';
      res.status(500).json({ error: message });
    }
  },
);

/** PATCH /api/second-brain/thoughts/:id */
secondBrainRouter.patch(
  '/thoughts/:id',
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const id = parseThoughtId(req);
      if (!id) {
        res.status(400).json({ error: 'Invalid thought ID' });
        return;
      }
      const rawText =
        typeof req.body?.rawText === 'string'
          ? sanitizeFreeText(req.body.rawText, 10000)
          : undefined;
      const category =
        typeof req.body?.category === 'string' &&
        ['PROJECTS', 'PEOPLE', 'IDEAS', 'ADMIN', 'RESOURCES', 'REVIEW'].includes(req.body.category)
          ? req.body.category
          : undefined;
      const confidence =
        typeof req.body?.confidence === 'number' ? req.body.confidence : undefined;

      if (rawText === undefined && category === undefined && confidence === undefined) {
        res.status(400).json({ error: 'At least one of rawText, category, or confidence is required' });
        return;
      }

      const result = await updateThought(id, {
        rawText,
        category: category as Parameters<typeof updateThought>[1]['category'],
        confidence,
      });
      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update thought';
      res.status(500).json({ error: message });
    }
  },
);

/** POST /api/second-brain/thoughts/:id/route */
secondBrainRouter.post(
  '/thoughts/:id/route',
  requireGemini,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const id = parseThoughtId(req);
      if (!id) {
        res.status(400).json({ error: 'Invalid thought ID' });
        return;
      }
      const rawText =
        typeof req.body?.rawText === 'string'
          ? sanitizeFreeText(req.body.rawText.trim(), 10000) || undefined
          : undefined;
      const result = await routeThought(id, rawText);
      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to route thought';
      res.status(500).json({ error: message });
    }
  },
);

/** DELETE /api/second-brain/thoughts/:id */
secondBrainRouter.delete(
  '/thoughts/:id',
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const id = parseThoughtId(req);
      if (!id) {
        res.status(400).json({ error: 'Invalid thought ID' });
        return;
      }
      await deleteThought(id);
      res.status(204).send();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete thought';
      res.status(500).json({ error: message });
    }
  },
);

/** GET /api/second-brain/digest — raw digest data (for UI or email) */
secondBrainRouter.get('/digest', async (_req, res): Promise<void> => {
  try {
    const data = await getDigestData();
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to get digest data';
    res.status(500).json({ error: message });
  }
});

/** GET /api/second-brain/digest/generate — AI-generated morning digest */
secondBrainRouter.get(
  '/digest/generate',
  requireGemini,
  async (_req, res): Promise<void> => {
    try {
      const text = await generateMorningDigest();
      res.json({ digest: text });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate digest';
      res.status(500).json({ error: message });
    }
  },
);

/** GET /api/second-brain/review — raw review data */
secondBrainRouter.get('/review', async (_req, res): Promise<void> => {
  try {
    const data = await getReviewData();
    res.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to get review data';
    res.status(500).json({ error: message });
  }
});

/** GET /api/second-brain/review/generate — AI-generated weekly review */
secondBrainRouter.get(
  '/review/generate',
  requireGemini,
  async (_req, res): Promise<void> => {
    try {
      const text = await generateWeeklyReview();
      res.json({ review: text });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate review';
      res.status(500).json({ error: message });
    }
  },
);

/** POST /api/second-brain/admin/backfill-embeddings — backfill missing vector embeddings */
secondBrainRouter.post(
  '/admin/backfill-embeddings',
  requireGemini,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await backfillSecondBrainEmbeddings();
      res.json({
        message: 'Backfill completed',
        ...result,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to backfill embeddings';
      logger.error({ err }, 'Second brain embeddings backfill failed');
      res.status(500).json({ error: message });
    }
  },
);

export { secondBrainRouter };
