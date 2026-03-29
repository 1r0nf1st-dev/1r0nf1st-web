import { supabase } from '../db/supabase.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export type AppErrorSource = 'server' | 'client' | 'next' | 'platform_supabase' | 'platform_vercel';

export interface InsertInteractionInput {
  kind: string;
  name: string;
  requestId?: string;
  sessionAnonId?: string;
  durationMs?: number;
  path?: string;
  httpMethod?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

export interface InsertErrorInput {
  source: AppErrorSource;
  severity?: 'error' | 'warn';
  errorType?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  httpMethod?: string;
  path?: string;
  statusCode?: number;
  requestId?: string;
  sessionAnonId?: string;
  payload?: Record<string, unknown>;
}

export interface InsertPlatformInput {
  provider: string;
  category: string;
  severity?: string;
  title?: string;
  message?: string;
  externalId?: string;
  occurredAt?: string;
  payload?: Record<string, unknown>;
}

function truncate(s: string | undefined, max: number): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  if (s.length <= max) {
    return s;
  }
  return s.slice(0, max);
}

function safeMetadata(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta || typeof meta !== 'object') {
    return {};
  }
  try {
    return JSON.parse(JSON.stringify(meta)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function isAppDbLoggingAvailable(): boolean {
  return Boolean(supabase && config.enableAppDbLogging);
}

/**
 * Fire-and-forget API interaction row. Never throws to callers.
 */
export function recordInteractionEvent(input: InsertInteractionInput): void {
  if (!isAppDbLoggingAvailable() || !supabase) {
    return;
  }

  const row = {
    kind: truncate(input.kind, 120) ?? 'unknown',
    name: truncate(input.name, 500) ?? '',
    request_id: truncate(input.requestId, 120),
    session_anon_id: truncate(input.sessionAnonId, 80),
    duration_ms:
      input.durationMs !== undefined && Number.isFinite(input.durationMs)
        ? Math.min(Math.max(0, Math.floor(input.durationMs)), 86_400_000)
        : null,
    path: truncate(input.path, 500),
    http_method: truncate(input.httpMethod, 16),
    status_code:
      input.statusCode !== undefined && Number.isFinite(input.statusCode)
        ? Math.floor(input.statusCode)
        : null,
    environment: truncate(config.nodeEnv, 32),
    release: truncate(config.appRelease, 120),
    metadata: safeMetadata(input.metadata),
  };

  void supabase
    .from('app_interaction_events')
    .insert(row)
    .then(({ error }) => {
      if (error) {
        logger.warn({ err: error.message }, 'app_interaction_events insert failed');
      }
    });
}

/**
 * Fire-and-forget error row. Never throws to callers.
 */
export function recordErrorEvent(input: InsertErrorInput): void {
  if (!isAppDbLoggingAvailable() || !supabase) {
    return;
  }

  const row = {
    source: truncate(input.source, 40) ?? 'server',
    severity: input.severity === 'warn' ? 'warn' : 'error',
    error_type: truncate(input.errorType, 200),
    message: truncate(input.message, 4000) ?? '',
    stack: truncate(input.stack, 12_000),
    component_stack: truncate(input.componentStack, 8000),
    http_method: truncate(input.httpMethod, 16),
    path: truncate(input.path, 500),
    status_code:
      input.statusCode !== undefined && Number.isFinite(input.statusCode)
        ? Math.floor(input.statusCode)
        : null,
    request_id: truncate(input.requestId, 120),
    session_anon_id: truncate(input.sessionAnonId, 80),
    environment: truncate(config.nodeEnv, 32),
    release: truncate(config.appRelease, 120),
    payload: safeMetadata(input.payload),
  };

  void supabase
    .from('app_error_events')
    .insert(row)
    .then(({ error }) => {
      if (error) {
        logger.warn({ err: error.message }, 'app_error_events insert failed');
      }
    });
}

export function recordPlatformEvent(input: InsertPlatformInput): void {
  if (!isAppDbLoggingAvailable() || !supabase) {
    return;
  }

  const row = {
    provider: truncate(input.provider, 40) ?? 'unknown',
    category: truncate(input.category, 80) ?? 'unknown',
    severity: truncate(input.severity, 32),
    title: truncate(input.title, 500),
    message: truncate(input.message, 8000),
    external_id: truncate(input.externalId, 500),
    occurred_at: input.occurredAt ?? null,
    environment: truncate(config.nodeEnv, 32),
    release: truncate(config.appRelease, 120),
    payload: safeMetadata(input.payload),
  };

  void supabase
    .from('app_platform_events')
    .insert(row)
    .then(({ error }) => {
      if (error) {
        logger.warn({ err: error.message }, 'app_platform_events insert failed');
      }
    });
}

export type DateTruncStep = 'hour' | 'day' | 'week' | 'month';

const STEP_SET: ReadonlySet<string> = new Set(['hour', 'day', 'week', 'month']);

export function parseSummaryStep(raw: string | undefined): DateTruncStep {
  if (raw && STEP_SET.has(raw)) {
    return raw as DateTruncStep;
  }
  return 'hour';
}

export interface SummaryRange {
  from: string;
  to: string;
}

export function parseSummaryRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
): SummaryRange | null {
  const now = Date.now();
  const toMs = toRaw ? Date.parse(toRaw) : now;
  const fromMs = fromRaw ? Date.parse(fromRaw) : now - 24 * 60 * 60 * 1000;
  if (!Number.isFinite(toMs) || !Number.isFinite(fromMs) || fromMs > toMs) {
    return null;
  }
  const maxSpan = 90 * 24 * 60 * 60 * 1000;
  if (toMs - fromMs > maxSpan) {
    return null;
  }
  return { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() };
}

export async function fetchErrorSummary(
  range: SummaryRange,
  step: DateTruncStep,
): Promise<{
  buckets: { bucketStart: string; count: number }[];
  byPath: { path: string; count: number }[];
  bySource: { source: string; count: number }[];
}> {
  if (!supabase) {
    return { buckets: [], byPath: [], bySource: [] };
  }

  const [bucketsRes, pathRes, sourceRes] = await Promise.all([
    supabase.rpc('app_log_error_bucket_counts', {
      p_from: range.from,
      p_to: range.to,
      p_step: step,
    }),
    supabase.rpc('app_log_errors_by_path', {
      p_from: range.from,
      p_to: range.to,
      p_limit: 25,
    }),
    supabase.rpc('app_log_errors_by_source', {
      p_from: range.from,
      p_to: range.to,
    }),
  ]);

  const buckets = (bucketsRes.data ?? []).map(
    (r: { bucket_start: string; event_count: number }) => ({
      bucketStart: r.bucket_start,
      count: Number(r.event_count),
    }),
  );
  const byPath = (pathRes.data ?? []).map((r: { path: string; event_count: number }) => ({
    path: r.path,
    count: Number(r.event_count),
  }));
  const bySource = (sourceRes.data ?? []).map((r: { source: string; event_count: number }) => ({
    source: r.source,
    count: Number(r.event_count),
  }));

  if (bucketsRes.error) {
    logger.warn({ err: bucketsRes.error.message }, 'app_log_error_bucket_counts failed');
  }
  if (pathRes.error) {
    logger.warn({ err: pathRes.error.message }, 'app_log_errors_by_path failed');
  }
  if (sourceRes.error) {
    logger.warn({ err: sourceRes.error.message }, 'app_log_errors_by_source failed');
  }

  return { buckets, byPath, bySource };
}

export async function fetchInteractionSummary(
  range: SummaryRange,
  step: DateTruncStep,
): Promise<{
  buckets: { bucketStart: string; count: number }[];
  byPath: { path: string; count: number }[];
}> {
  if (!supabase) {
    return { buckets: [], byPath: [] };
  }

  const [bucketsRes, pathRes] = await Promise.all([
    supabase.rpc('app_log_interaction_bucket_counts', {
      p_from: range.from,
      p_to: range.to,
      p_step: step,
    }),
    supabase.rpc('app_log_interactions_by_path', {
      p_from: range.from,
      p_to: range.to,
      p_limit: 25,
    }),
  ]);

  const buckets = (bucketsRes.data ?? []).map(
    (r: { bucket_start: string; event_count: number }) => ({
      bucketStart: r.bucket_start,
      count: Number(r.event_count),
    }),
  );
  const byPath = (pathRes.data ?? []).map((r: { path: string; event_count: number }) => ({
    path: r.path,
    count: Number(r.event_count),
  }));

  if (bucketsRes.error) {
    logger.warn({ err: bucketsRes.error.message }, 'app_log_interaction_bucket_counts failed');
  }
  if (pathRes.error) {
    logger.warn({ err: pathRes.error.message }, 'app_log_interactions_by_path failed');
  }

  return { buckets, byPath };
}

export async function fetchPlatformSummary(
  range: SummaryRange,
  step: DateTruncStep,
): Promise<{ buckets: { bucketStart: string; count: number }[] }> {
  if (!supabase) {
    return { buckets: [] };
  }

  const bucketsRes = await supabase.rpc('app_log_platform_bucket_counts', {
    p_from: range.from,
    p_to: range.to,
    p_step: step,
  });

  const buckets = (bucketsRes.data ?? []).map(
    (r: { bucket_start: string; event_count: number }) => ({
      bucketStart: r.bucket_start,
      count: Number(r.event_count),
    }),
  );

  if (bucketsRes.error) {
    logger.warn({ err: bucketsRes.error.message }, 'app_log_platform_bucket_counts failed');
  }

  return { buckets };
}

const MAX_LIST = 200;

export async function listErrorEvents(
  range: SummaryRange,
  limit: number,
  offset: number,
): Promise<{ rows: Record<string, unknown>[]; total: number | null }> {
  if (!supabase) {
    return { rows: [], total: null };
  }
  const lim = Math.min(Math.max(1, limit), MAX_LIST);
  const off = Math.max(0, offset);

  const q = supabase
    .from('app_error_events')
    .select('*', { count: 'exact' })
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .order('created_at', { ascending: false })
    .range(off, off + lim - 1);

  const { data, error, count } = await q;
  if (error) {
    logger.warn({ err: error.message }, 'listErrorEvents failed');
    return { rows: [], total: null };
  }
  return { rows: (data ?? []) as Record<string, unknown>[], total: count };
}

export async function listInteractionEvents(
  range: SummaryRange,
  limit: number,
  offset: number,
): Promise<{ rows: Record<string, unknown>[]; total: number | null }> {
  if (!supabase) {
    return { rows: [], total: null };
  }
  const lim = Math.min(Math.max(1, limit), MAX_LIST);
  const off = Math.max(0, offset);

  const { data, error, count } = await supabase
    .from('app_interaction_events')
    .select('*', { count: 'exact' })
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .order('created_at', { ascending: false })
    .range(off, off + lim - 1);

  if (error) {
    logger.warn({ err: error.message }, 'listInteractionEvents failed');
    return { rows: [], total: null };
  }
  return { rows: (data ?? []) as Record<string, unknown>[], total: count };
}

export async function listPlatformEvents(
  range: SummaryRange,
  limit: number,
  offset: number,
): Promise<{ rows: Record<string, unknown>[]; total: number | null }> {
  if (!supabase) {
    return { rows: [], total: null };
  }
  const lim = Math.min(Math.max(1, limit), MAX_LIST);
  const off = Math.max(0, offset);

  const { data, error, count } = await supabase
    .from('app_platform_events')
    .select('*', { count: 'exact' })
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .order('created_at', { ascending: false })
    .range(off, off + lim - 1);

  if (error) {
    logger.warn({ err: error.message }, 'listPlatformEvents failed');
    return { rows: [], total: null };
  }
  return { rows: (data ?? []) as Record<string, unknown>[], total: count };
}
