/**
 * Normalize Vercel Log Drain entries and Supabase webhook payloads into rows for app_platform_events.
 * @see https://vercel.com/docs/drains/reference/logs
 * @see https://supabase.com/docs/guides/database/webhooks
 */

export interface PlatformIngestRow {
  provider: string;
  category: string;
  severity?: string;
  title?: string;
  message?: string;
  externalId?: string;
  occurredAt?: string;
  payload?: Record<string, unknown>;
}

const VERCEL_SOURCES = new Set([
  'build',
  'edge',
  'lambda',
  'static',
  'external',
  'firewall',
  'redirect',
]);

const VERCEL_LEVELS = new Set(['info', 'warning', 'error', 'fatal']);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isVercelLogEntry(item: unknown): boolean {
  if (!isRecord(item)) {
    return false;
  }
  const id = item.id;
  const deploymentId = item.deploymentId;
  const projectId = item.projectId;
  const source = item.source;
  const level = item.level;
  const timestamp = item.timestamp;
  return (
    typeof id === 'string' &&
    typeof deploymentId === 'string' &&
    typeof projectId === 'string' &&
    typeof source === 'string' &&
    VERCEL_SOURCES.has(source) &&
    typeof level === 'string' &&
    VERCEL_LEVELS.has(level) &&
    typeof timestamp === 'number' &&
    Number.isFinite(timestamp)
  );
}

function vercelTimestampToIso(ts: number): string {
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toISOString();
}

export function mapVercelLogEntry(item: Record<string, unknown>): PlatformIngestRow {
  const source = String(item.source);
  const message =
    typeof item.message === 'string' && item.message.length > 0
      ? item.message.slice(0, 8000)
      : `[${source}] ${typeof item.host === 'string' ? item.host : 'log'}`;

  const payload: Record<string, unknown> = {
    deploymentId: item.deploymentId,
    projectId: item.projectId,
    host: item.host,
    path: item.path,
    statusCode: item.statusCode,
    requestId: item.requestId,
    environment: item.environment,
    branch: item.branch,
    projectName: item.projectName,
    executionRegion: item.executionRegion,
    traceId: item.traceId,
    spanId: item.spanId,
  };
  if (isRecord(item.proxy)) {
    payload.proxy = {
      method: item.proxy.method,
      path: item.proxy.path,
      host: item.proxy.host,
    };
  }

  return {
    provider: 'vercel',
    category: `log_${source}`,
    severity: String(item.level),
    title:
      typeof item.projectName === 'string'
        ? `${item.projectName} · ${source}`
        : `${String(item.projectId).slice(0, 8)}… · ${source}`,
    message,
    externalId: String(item.id),
    occurredAt: vercelTimestampToIso(item.timestamp as number),
    payload,
  };
}

const SB_DB_TYPES = new Set(['INSERT', 'UPDATE', 'DELETE']);

export function isSupabaseDatabaseWebhook(item: unknown): boolean {
  if (!isRecord(item)) {
    return false;
  }
  const t = item.type;
  const schema = item.schema;
  const table = item.table;
  return (
    typeof t === 'string' &&
    SB_DB_TYPES.has(t) &&
    typeof schema === 'string' &&
    typeof table === 'string'
  );
}

/** Record keys only — avoid storing row payloads (PII). */
function recordKeySummary(record: unknown): string[] {
  if (!isRecord(record)) {
    return [];
  }
  return Object.keys(record).slice(0, 80);
}

export function mapSupabaseDatabaseWebhook(item: Record<string, unknown>): PlatformIngestRow {
  const schema = String(item.schema);
  const table = String(item.table);
  const type = String(item.type);
  const record = item.record;
  const oldRecord = item.old_record;

  return {
    provider: 'supabase',
    category: `db_${type.toLowerCase()}`,
    severity: 'info',
    title: `${schema}.${table}`,
    message: `Database ${type} on ${schema}.${table}`,
    externalId: undefined,
    occurredAt: new Date().toISOString(),
    payload: {
      schema,
      table,
      type,
      recordKeys: recordKeySummary(record),
      oldRecordKeys: recordKeySummary(oldRecord),
    },
  };
}

export function isCustomPlatformRow(item: unknown): boolean {
  if (!isRecord(item)) {
    return false;
  }
  const provider = item.provider;
  const category = item.category;
  return (
    typeof provider === 'string' &&
    provider.length > 0 &&
    typeof category === 'string' &&
    category.length > 0
  );
}

export function mapCustomPlatformRow(item: Record<string, unknown>): PlatformIngestRow {
  return {
    provider: String(item.provider),
    category: String(item.category),
    severity: typeof item.severity === 'string' ? item.severity : undefined,
    title: typeof item.title === 'string' ? item.title : undefined,
    message: typeof item.message === 'string' ? item.message : undefined,
    externalId: typeof item.externalId === 'string' ? item.externalId : undefined,
    occurredAt: typeof item.occurredAt === 'string' ? item.occurredAt : undefined,
    payload: isRecord(item.payload) ? item.payload : undefined,
  };
}

function expandItem(item: unknown): PlatformIngestRow[] {
  if (!item || typeof item !== 'object') {
    return [];
  }
  if (isVercelLogEntry(item)) {
    return [mapVercelLogEntry(item as Record<string, unknown>)];
  }
  if (isSupabaseDatabaseWebhook(item)) {
    return [mapSupabaseDatabaseWebhook(item as Record<string, unknown>)];
  }
  if (isCustomPlatformRow(item)) {
    return [mapCustomPlatformRow(item as Record<string, unknown>)];
  }
  return [];
}

/**
 * Accepts: custom row(s), Vercel batch (array or `{ logs: [...] }`), Supabase DB webhook object, or arrays thereof.
 */
export function expandPlatformIngestBody(body: unknown): PlatformIngestRow[] {
  if (body === null || body === undefined) {
    return [];
  }

  if (Array.isArray(body)) {
    return body.flatMap(expandItem);
  }

  if (isRecord(body) && Array.isArray(body.logs)) {
    return body.logs.flatMap(expandItem);
  }

  return expandItem(body);
}
