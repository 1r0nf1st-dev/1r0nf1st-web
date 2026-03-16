import type { SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const OB_NODES = 'ob_nodes';
const OB_EDGES = 'ob_edges';

const MATCH_THRESHOLD = 0.85;
const MATCH_COUNT = 5;

interface GeminiRequestInit extends RequestInit {
  timeoutMs?: number;
}

async function fetchWithTimeout(
  url: string,
  { timeoutMs = 15_000, ...init }: GeminiRequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Gemini request timed out');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

async function fetchWithRetry(
  url: string,
  init: GeminiRequestInit,
  retries = 2,
  backoffMs = 500,
): Promise<Response> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetchWithTimeout(url, init);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini Embedding API error ${res.status}: ${errText}`);
      }
      return res;
    } catch (error) {
      attempt += 1;
      const isLast = attempt > retries;
      logger.warn(
        {
          err: error instanceof Error ? error.message : String(error),
          attempt,
          retries,
          url,
        },
        'Gemini embedding request failed',
      );
      if (isLast) {
        throw error instanceof Error ? error : new Error(String(error));
      }
      // basic backoff
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, backoffMs * attempt));
    }
  }
}

/** Generate 768-dim embedding via Gemini. Exported for AI search/chat. */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
  const body = {
    model: 'models/gemini-embedding-001',
    content: { parts: [{ text }] },
    output_dimensionality: 768,
  };
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeoutMs: 20_000,
  });
  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Gemini embedding returned no values');
  }
  return values;
}

/** Generate short summary and tags via Gemini (JSON). */
async function generateSummaryAndTags(
  title: string,
  body: string | null,
): Promise<{ summary: string; tags: string[] }> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const input = body ? `${title}\n\n${body}` : title;
  const prompt = `Summarize the following in one short sentence (max 200 chars) and suggest 3-8 topic tags (lowercase, no spaces). Return ONLY valid JSON: { "summary": "...", "tags": ["tag1", "tag2", ...] }.\n\nInput:\n${input.slice(0, 8000)}`;
  const bodyReq = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 256,
      responseMimeType: 'application/json',
    },
  };
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyReq),
    timeoutMs: 20_000,
  });
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  try {
    const parsed = JSON.parse(raw) as { summary?: string; tags?: string[] };
    const summary = typeof parsed.summary === 'string' ? parsed.summary.slice(0, 500) : '';
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map((t) => String(t).toLowerCase().replace(/\s+/g, '-')).slice(0, 20)
      : [];
    return { summary, tags };
  } catch {
    return { summary: '', tags: [] };
  }
}

interface ObNodeRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  embedding: number[] | null;
}

interface ObSearchNodeRow {
  id: string;
  similarity: number;
}

/**
 * Run enrichment pipeline for an ob_node: embedding, summary/tags, then discover edges.
 * Uses service-role Supabase. Intended to be run in background (do not await in request handler).
 */
export async function runEnrichmentPipeline(
  supabase: SupabaseClient,
  nodeId: string,
  userId: string,
): Promise<void> {
  if (!config.geminiApiKey) {
    logger.debug('Skipping OB enrichment: GEMINI_API_KEY not set');
    return;
  }

  const { data: node, error: fetchError } = await supabase
    .from(OB_NODES)
    .select('id, user_id, title, body, embedding')
    .eq('id', nodeId)
    .single();

  if (fetchError || !node) {
    logger.warn({ nodeId, err: fetchError?.message }, 'OB enrichment: node not found');
    return;
  }

  const row = node as ObNodeRow;
  const textToEmbed = [row.title, row.body].filter(Boolean).join(' ').trim();
  if (!textToEmbed) {
    logger.debug({ nodeId }, 'OB enrichment: no text to embed');
    return;
  }

  try {
    // 1) Embed and update
    const embedding = await getEmbedding(textToEmbed);
    const { error: updateEmbError } = await supabase
      .from(OB_NODES)
      .update({ embedding })
      .eq('id', nodeId)
      .eq('user_id', userId);

    if (updateEmbError) {
      logger.warn({ nodeId, err: updateEmbError.message }, 'OB enrichment: failed to save embedding');
      return;
    }

    // 2) Summary and tags
    const { summary, tags } = await generateSummaryAndTags(row.title, row.body);
    const { error: updateMetaError } = await supabase
      .from(OB_NODES)
      .update({
        ai_summary: summary || null,
        ai_tags: tags.length > 0 ? tags : [],
      })
      .eq('id', nodeId)
      .eq('user_id', userId);

    if (updateMetaError) {
      logger.warn({ nodeId, err: updateMetaError.message }, 'OB enrichment: failed to save summary/tags');
    }

    // 3) Discover edges via semantic search (exclude self)
    const { data: similar, error: rpcError } = await supabase.rpc('ob_search_nodes', {
      query_embedding: embedding,
      match_threshold: MATCH_THRESHOLD,
      match_count: MATCH_COUNT,
      owner_id: userId,
    });

    if (rpcError || !Array.isArray(similar)) {
      logger.warn({ nodeId, err: rpcError?.message }, 'OB enrichment: ob_search_nodes failed');
      return;
    }

    for (const s of similar as ObSearchNodeRow[]) {
      if (s.id === nodeId) continue;
      const weight = typeof s.similarity === 'number' ? Math.min(1, Math.max(0, s.similarity)) : 1;
      const { error: edgeError } = await supabase.from(OB_EDGES).insert({
        from_node_id: nodeId,
        to_node_id: s.id,
        edge_type: 'references',
        created_by: 'ai',
        weight,
      });
      if (edgeError) {
        if (edgeError.code === '23505') {
          // unique violation - edge already exists, skip
          continue;
        }
        logger.warn({ nodeId, toId: s.id, err: edgeError.message }, 'OB enrichment: edge insert failed');
      }
    }
  } catch (err) {
    logger.warn({ nodeId, err: err instanceof Error ? err.message : String(err) }, 'OB enrichment failed');
    throw err;
  }
}
