import type { SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { getEmbedding } from './obEnrichmentService.js';
import { logger } from '../utils/logger.js';

const OB_AI_SESSIONS = 'ob_ai_sessions';
const DEFAULT_MATCH_THRESHOLD = 0.65;
const DEFAULT_SEARCH_LIMIT = 15;
const DEFAULT_CHAT_CONTEXT_LIMIT = 15;

export interface ObSearchResult {
  id: string;
  title: string | null;
  body: string | null;
  node_type: string;
  ai_summary: string | null;
  ai_tags: string[];
  user_tags: string[];
  user_id: string;
  similarity: number;
}

export interface ObChatContextRow {
  source_table: string;
  record_id: string;
  label: string;
  detail: string;
  similarity: number;
  created_at: string;
}

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
        throw new Error(`Gemini API error ${res.status}: ${errText}`);
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
        'Gemini request failed',
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

/** Call Gemini generateContent (text). */
async function generateText(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  };
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeoutMs: 20_000,
  });
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  return output;
}

export type ObNodeTypeFilter =
  | 'note'
  | 'concept'
  | 'question'
  | 'source'
  | 'project';

const VALID_NODE_TYPES: ObNodeTypeFilter[] = [
  'note',
  'concept',
  'question',
  'source',
  'project',
];

/**
 * Semantic search over ob_nodes. Uses service-role Supabase.
 * ownerId: search only this user's nodes; if null, results depend on RPC (e.g. caller's visibility).
 * nodeType: optional filter by ob_node_type.
 */
export async function searchObNodes(
  supabase: SupabaseClient,
  query: string,
  ownerId: string | null,
  limit = DEFAULT_SEARCH_LIMIT,
  nodeType?: ObNodeTypeFilter | null,
): Promise<ObSearchResult[]> {
  const embedding = await getEmbedding(query.trim() || ' ');
  const matchThreshold = DEFAULT_MATCH_THRESHOLD;
  const payload: Record<string, unknown> = {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: Math.min(limit, 50),
    owner_id: ownerId,
  };
  if (
    nodeType != null &&
    VALID_NODE_TYPES.includes(nodeType as ObNodeTypeFilter)
  ) {
    payload.filter_node_type = nodeType;
  }
  const { data, error } = await supabase.rpc('ob_search_nodes', payload);
  if (error) throw new Error(`Search failed: ${error.message}`);
  return (data ?? []) as ObSearchResult[];
}

export interface ObExploreResult extends ObSearchResult {
  username: string;
  brain_slug: string;
}

/**
 * Cross-brain search: semantic search over all public ob_nodes, with profile (username, brain_slug).
 * Uses service-role; RPC with owner_id null returns only public nodes.
 * nodeType: optional filter by ob_node_type.
 */
export async function exploreObNodes(
  supabase: SupabaseClient,
  query: string,
  limit = 20,
  nodeType?: ObNodeTypeFilter | null,
): Promise<ObExploreResult[]> {
  const results = await searchObNodes(supabase, query, null, limit, nodeType);
  if (results.length === 0) return [];

  const userIds = [...new Set(results.map((r) => r.user_id))];
  const { data: profiles, error: profError } = await supabase
    .from('ob_profiles')
    .select('id, username, brain_slug')
    .in('id', userIds);
  if (profError) throw new Error(`Profile fetch failed: ${profError.message}`);
  const profileMap = new Map(
    (profiles ?? []).map((p: { id: string; username: string; brain_slug: string }) => [p.id, p]),
  );

  return results.map((r) => {
    const p = profileMap.get(r.user_id);
    return {
      ...r,
      username: p?.username ?? 'unknown',
      brain_slug: p?.brain_slug ?? '',
    };
  });
}

/**
 * RAG chat: get context from ob_search_all_brain, then generate reply with Gemini.
 * Saves to ob_ai_sessions. Returns response and cited record IDs.
 */
export async function chatWithBrain(
  supabase: SupabaseClient,
  query: string,
  brainOwnerId: string,
  viewerUserId: string,
  options: {
    history?: Array<{ role: string; content: string }>;
    username?: string;
  } = {},
): Promise<{ response: string; citedNodeIds: string[] }> {
  const embedding = await getEmbedding(query.trim() || ' ');
  const { data: contextRows, error: rpcError } = await supabase.rpc('ob_search_all_brain', {
    query_embedding: embedding,
    owner_id: brainOwnerId,
    match_threshold: DEFAULT_MATCH_THRESHOLD,
    match_count: DEFAULT_CHAT_CONTEXT_LIMIT,
  });

  if (rpcError) throw new Error(`Brain search failed: ${rpcError.message}`);

  const rows = (contextRows ?? []) as ObChatContextRow[];
  const citedNodeIds = [...new Set(rows.map((r) => r.record_id))];

  const contextBlocks = rows.map(
    (r) => `[source: ${r.source_table}] (${r.record_id})\n${r.label}: ${r.detail}`,
  );
  const contextString = contextBlocks.join('\n\n');

  const username = options.username ?? 'this user';
  const systemPrompt = `You are an AI interface to ${username}'s open brain. Answer using only the knowledge provided below. Always cite the source (e.g. [source: ob_nodes] or record id) when you use a fact. If the context does not contain relevant information, say so briefly.`;
  const userPrompt = `Context:\n${contextString || '(No matching content)'}\n\nQuestion: ${query}`;

  const response = await generateText(systemPrompt, userPrompt);

  const messages = [
    ...(options.history ?? []),
    { role: 'user', content: query },
    { role: 'assistant', content: response },
  ];

  const { error: insertError } = await supabase.from(OB_AI_SESSIONS).insert({
    user_id: viewerUserId,
    brain_owner_id: brainOwnerId,
    query,
    response,
    cited_node_ids: citedNodeIds,
    messages,
    session_type: 'chat',
  });

  if (insertError) {
    // Log but don't fail the request
    const { logger } = await import('../utils/logger.js');
    logger.warn({ err: insertError.message }, 'ob_ai_sessions insert failed');
  }

  return { response, citedNodeIds };
}

/** Expand a single node: questions, counter-arguments, related directions. */
export async function expandNode(
  supabase: SupabaseClient,
  nodeId: string,
  userId: string,
): Promise<{ questions: string[]; counterArguments: string[]; relatedDirections: string[] }> {
  const { data: node, error } = await supabase
    .from('ob_nodes')
    .select('id, title, body, ai_summary')
    .eq('id', nodeId)
    .eq('user_id', userId)
    .single();

  if (error || !node) {
    throw new Error('Node not found');
  }

  const content = [
    (node as { title?: string }).title,
    (node as { body?: string }).body,
    (node as { ai_summary?: string }).ai_summary,
  ]
    .filter(Boolean)
    .join('\n\n');

  const systemPrompt =
    'You are an assistant that deepens thinking. Return ONLY valid JSON with three arrays: "questions" (3-5 probing questions), "counterArguments" (2-4 counter-arguments or objections), "relatedDirections" (2-4 related topics or directions to explore).';
  const userPrompt = `Content:\n${content.slice(0, 6000)}\n\nGenerate the JSON.`;

  const raw = await generateText(systemPrompt, userPrompt);
  try {
    const parsed = JSON.parse(raw) as {
      questions?: string[];
      counterArguments?: string[];
      relatedDirections?: string[];
    };
    return {
      questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 10) : [],
      counterArguments: Array.isArray(parsed.counterArguments)
        ? parsed.counterArguments.slice(0, 10)
        : [],
      relatedDirections: Array.isArray(parsed.relatedDirections)
        ? parsed.relatedDirections.slice(0, 10)
        : [],
    };
  } catch {
    return { questions: [], counterArguments: [], relatedDirections: [] };
  }
}

/** Synthesize a narrative connecting the given nodes. */
export async function synthesizeNodes(
  supabase: SupabaseClient,
  topic: string,
  nodeIds: string[],
  userId: string,
): Promise<{ narrative: string }> {
  if (!nodeIds.length) {
    return { narrative: '' };
  }

  const { data: nodes, error } = await supabase
    .from('ob_nodes')
    .select('id, title, body, ai_summary')
    .in('id', nodeIds.slice(0, 20))
    .eq('user_id', userId);

  if (error || !nodes?.length) {
    throw new Error('Could not load nodes');
  }

  const blocks = (nodes as Array<{ id: string; title?: string; body?: string; ai_summary?: string }>).map(
    (n) => `[${n.id}] ${n.title ?? ''}\n${[n.ai_summary, n.body].filter(Boolean).join('\n')}`,
  );
  const context = blocks.join('\n\n---\n\n');

  const systemPrompt = `You are an assistant that weaves a coherent narrative connecting the given notes. Use only the provided content. Write in clear, concise paragraphs.`;
  const userPrompt = `Topic or theme: ${topic}\n\nNotes:\n${context.slice(0, 12000)}\n\nWrite a short narrative (2-5 paragraphs) connecting these ideas around the topic.`;

  const narrative = await generateText(systemPrompt, userPrompt);
  return { narrative };
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface ObDigestData {
  nodesRecent: Array<{
    id: string;
    title: string | null;
    ai_summary: string | null;
    node_type: string;
    created_at: string;
  }>;
  thoughtsRecent: Array<{
    id: string;
    raw_text: string;
    created_at: string;
  }>;
}

/**
 * Fetch data for OB weekly digest: ob_nodes (last 7 days, for user) and sb_thoughts (last 7 days, not routed).
 */
export async function getObDigestData(
  supabase: SupabaseClient,
  userId: string,
): Promise<ObDigestData> {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  const [nodesRes, thoughtsRes] = await Promise.all([
    supabase
      .from('ob_nodes')
      .select('id, title, ai_summary, node_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false }),
    supabase
      .from('sb_thoughts')
      .select('id, raw_text, created_at')
      .eq('routed', false)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  if (nodesRes.error) throw new Error(`OB digest nodes: ${nodesRes.error.message}`);
  if (thoughtsRes.error) throw new Error(`OB digest thoughts: ${thoughtsRes.error.message}`);

  return {
    nodesRecent: (nodesRes.data ?? []) as ObDigestData['nodesRecent'],
    thoughtsRecent: (thoughtsRes.data ?? []) as ObDigestData['thoughtsRecent'],
  };
}

const OB_DIGEST_PROMPT = `You are a supportive assistant summarizing this user's open brain and second-brain capture from the last 7 days.

Open Brain nodes (last 7 days):
{{NODES_JSON}}

Second-brain thoughts not yet routed (last 7 days):
{{THOUGHTS_JSON}}

Write a short weekly digest (max 250 words). Include:
1. Themes or patterns across the new nodes
2. One or two suggested connections between nodes or between nodes and thoughts
3. A brief mention of any uncaptured or unrouted thoughts worth revisiting

Plain text only, no markdown. Tone: clear and encouraging.`;

/**
 * Generate OB weekly digest text via Gemini using last 7 days of nodes and sb_thoughts.
 */
export async function generateObDigest(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const data = await getObDigestData(supabase, userId);
  const nodesForPrompt = data.nodesRecent.map((n) => ({
    title: n.title ?? 'Untitled',
    type: n.node_type,
    summary: n.ai_summary ?? null,
    created_at: n.created_at,
  }));
  const thoughtsForPrompt = data.thoughtsRecent.map((t) => ({
    text: t.raw_text.slice(0, 300),
    created_at: t.created_at,
  }));
  const prompt = OB_DIGEST_PROMPT
    .replace('{{NODES_JSON}}', JSON.stringify(nodesForPrompt, null, 2))
    .replace('{{THOUGHTS_JSON}}', JSON.stringify(thoughtsForPrompt, null, 2));
  const systemPrompt = 'You write concise, useful weekly digests. Output only the digest text.';
  return generateText(systemPrompt, prompt);
}
