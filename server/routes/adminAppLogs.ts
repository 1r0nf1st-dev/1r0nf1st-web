import { Router, type Request } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { supabase } from '../db/supabase.js';
import {
  fetchErrorSummary,
  fetchInteractionSummary,
  fetchPlatformSummary,
  listErrorEvents,
  listInteractionEvents,
  listPlatformEvents,
  parseSummaryRange,
  parseSummaryStep,
} from '../services/appEventLogService.js';

export const adminAppLogsRouter = Router();

adminAppLogsRouter.use(authenticateToken);
adminAppLogsRouter.use(requireAdmin);

/**
 * Combined summary for admin dashboards (line/bar charts, breakdowns).
 * Query: from, to (ISO), step (hour|day|week|month)
 */
adminAppLogsRouter.get('/summary', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }

  const range = parseSummaryRange(
    firstQueryString(req.query, 'from'),
    firstQueryString(req.query, 'to'),
  );
  if (!range) {
    res.status(400).json({ error: 'Invalid or missing from/to range (max 90 days)' });
    return;
  }

  const step = parseSummaryStep(firstQueryString(req.query, 'step'));

  const [errors, interactions, platform] = await Promise.all([
    fetchErrorSummary(range, step),
    fetchInteractionSummary(range, step),
    fetchPlatformSummary(range, step),
  ]);

  res.json({
    range,
    step,
    errors,
    interactions,
    platform,
  });
});

function firstQueryString(query: Request['query'], key: string): string | undefined {
  const v = query[key];
  if (typeof v === 'string') {
    return v;
  }
  if (Array.isArray(v) && typeof v[0] === 'string') {
    return v[0];
  }
  return undefined;
}

function parseListParams(
  req: Request,
): { range: { from: string; to: string }; limit: number; offset: number } | null {
  const range = parseSummaryRange(
    firstQueryString(req.query, 'from'),
    firstQueryString(req.query, 'to'),
  );
  if (!range) {
    return null;
  }
  const limitRaw = firstQueryString(req.query, 'limit');
  const offsetRaw = firstQueryString(req.query, 'offset');
  const limitParsed = limitRaw !== undefined ? Number.parseInt(limitRaw, 10) : 50;
  const offsetParsed = offsetRaw !== undefined ? Number.parseInt(offsetRaw, 10) : 0;
  const limit = Number.isFinite(limitParsed) ? limitParsed : 50;
  const offset = Number.isFinite(offsetParsed) ? offsetParsed : 0;
  return { range, limit, offset };
}

adminAppLogsRouter.get('/errors', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }
  const params = parseListParams(req);
  if (!params) {
    res.status(400).json({ error: 'Invalid or missing from/to range' });
    return;
  }
  const { rows, total } = await listErrorEvents(params.range, params.limit, params.offset);
  res.json({ rows, total, range: params.range, limit: params.limit, offset: params.offset });
});

adminAppLogsRouter.get('/interactions', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }
  const params = parseListParams(req);
  if (!params) {
    res.status(400).json({ error: 'Invalid or missing from/to range' });
    return;
  }
  const { rows, total } = await listInteractionEvents(params.range, params.limit, params.offset);
  res.json({ rows, total, range: params.range, limit: params.limit, offset: params.offset });
});

adminAppLogsRouter.get('/platform', async (req, res) => {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured' });
    return;
  }
  const params = parseListParams(req);
  if (!params) {
    res.status(400).json({ error: 'Invalid or missing from/to range' });
    return;
  }
  const { rows, total } = await listPlatformEvents(params.range, params.limit, params.offset);
  res.json({ rows, total, range: params.range, limit: params.limit, offset: params.offset });
});
