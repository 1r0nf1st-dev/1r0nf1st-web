import { supabase } from '../db/supabase.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export type SecondBrainCategory =
  | 'PROJECTS'
  | 'PEOPLE'
  | 'IDEAS'
  | 'ADMIN'
  | 'RESOURCES'
  | 'REVIEW';

export interface ClassificationResult {
  category: SecondBrainCategory;
  confidence: number;
  title: string;
  detail: string;
  extracted: Record<string, unknown>;
}

export interface SearchResult {
  table_name: string;
  record_id: string;
  label: string;
  detail: string | null;
  similarity: number;
  created_at: string;
}

const CLASSIFIER_PROMPT =
  'You are a classification engine for a personal Second Brain system.\n\n' +
  'Analyse the following input and return a single JSON object.\n\n' +
  'Input: "{{USER_MESSAGE}}"\n\n' +
  'Classify into ONE category: PROJECTS, PEOPLE, IDEAS, ADMIN, RESOURCES, or REVIEW.\n\n' +
  'Return ONLY valid JSON with: category, confidence (0-100), title, detail, extracted (object).\n\n' +
  'Rules:\n' +
  '- "idea:" or "ideas:" at start or on any line → IDEAS, confidence 90+\n' +
  '- "I wonder", "What if", creative spark, insight → IDEAS\n' +
  '- Action verbs ("Call", "Email", "Book", "Send", "Buy") → ADMIN\n' +
  '- Named person with context → PEOPLE\n' +
  '- Contains URL → RESOURCES\n' +
  '- Confidence below 60 → REVIEW (only when truly ambiguous)\n' +
  'Output JSON and nothing else.';

async function callGeminiGenerateContent(text: string): Promise<string> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: text }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const output =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  return output;
}

async function callGeminiEmbedContent(text: string): Promise<number[]> {
  const apiKey = config.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  // gemini-embedding-001 supports outputDimensionality 768 to match our vector schema
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
  const body: Record<string, unknown> = {
    model: 'models/text-embedding-004',
    content: { parts: [{ text: text }] },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini Embedding API error ${res.status}: ${errText}`);
  }
  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Gemini embedding returned no values');
  }
  return values;
}

const PREFIX_PATTERNS: Array<{
  pattern: RegExp;
  category: SecondBrainCategory;
  extractTitle: (match: string, full: string) => string;
  extractDetail: (match: string, full: string) => string;
}> = [
  {
    pattern: /^\s*projects?\s*:\s*/i,
    category: 'PROJECTS',
    extractTitle: (_, full) => full.replace(/^\s*projects?\s*:\s*/i, '').trim().slice(0, 50) || 'Untitled project',
    extractDetail: (_, full) => full.replace(/^\s*projects?\s*:\s*/i, '').trim() || full,
  },
  {
    pattern: /^\s*people\s*:\s*/i,
    category: 'PEOPLE',
    extractTitle: (_, full) => full.replace(/^\s*people\s*:\s*/i, '').trim().slice(0, 50) || 'Untitled person',
    extractDetail: (_, full) => full.replace(/^\s*people\s*:\s*/i, '').trim() || full,
  },
  {
    pattern: /^\s*ideas?\s*:\s*/i,
    category: 'IDEAS',
    extractTitle: (_, full) => full.replace(/^\s*ideas?\s*:\s*/i, '').trim().slice(0, 50) || 'Untitled idea',
    extractDetail: (_, full) => full.replace(/^\s*ideas?\s*:\s*/i, '').trim() || full,
  },
  {
    pattern: /^\s*admin\s*:\s*/i,
    category: 'ADMIN',
    extractTitle: (_, full) => full.replace(/^\s*admin\s*:\s*/i, '').trim().slice(0, 50) || 'Untitled task',
    extractDetail: (_, full) => full.replace(/^\s*admin\s*:\s*/i, '').trim() || full,
  },
  {
    pattern: /^\s*resources?\s*:\s*/i,
    category: 'RESOURCES',
    extractTitle: (_, full) => full.replace(/^\s*resources?\s*:\s*/i, '').trim().slice(0, 50) || 'Untitled resource',
    extractDetail: (_, full) => full.replace(/^\s*resources?\s*:\s*/i, '').trim() || full,
  },
];

function classifyByPrefix(trimmed: string): ClassificationResult | null {
  const lines = trimmed.split(/\r?\n/);
  for (const { pattern, category, extractTitle, extractDetail } of PREFIX_PATTERNS) {
    const line = lines.find((l) => pattern.test(l.trim()));
    if (line) {
      const rest = line.replace(pattern, '').trim() || trimmed;
      return {
        category,
        confidence: 95,
        title: extractTitle(rest, trimmed),
        detail: extractDetail(rest, trimmed),
        extracted: { title: rest, body: trimmed },
      };
    }
  }
  // Also check full text at start
  for (const { pattern, category, extractTitle, extractDetail } of PREFIX_PATTERNS) {
    if (pattern.test(trimmed)) {
      const rest = trimmed.replace(pattern, '').trim();
      return {
        category,
        confidence: 95,
        title: extractTitle(rest, trimmed),
        detail: extractDetail(rest, trimmed),
        extracted: { title: rest, body: trimmed },
      };
    }
  }
  return null;
}

export async function classifyText(rawText: string): Promise<ClassificationResult> {
  const trimmed = rawText.trim();

  const prefixResult = classifyByPrefix(trimmed);
  if (prefixResult) return prefixResult;

  const prompt = CLASSIFIER_PROMPT.replace('{{USER_MESSAGE}}', trimmed);
  const output = await callGeminiGenerateContent(prompt);
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch?.[0] ?? output;
  const parsed = JSON.parse(jsonStr) as ClassificationResult;
  if (!parsed.category || !['PROJECTS', 'PEOPLE', 'IDEAS', 'ADMIN', 'RESOURCES', 'REVIEW'].includes(parsed.category)) {
    parsed.category = 'REVIEW';
  }
  return parsed;
}

export async function getEmbedding(text: string): Promise<number[]> {
  return callGeminiEmbedContent(text);
}

export async function captureThought(
  rawText: string,
  source: 'web' | 'manual',
): Promise<{ thoughtId: string; category: SecondBrainCategory; routed: boolean }> {
  if (!supabase) throw new Error('Database not configured');
  if (!rawText?.trim()) throw new Error('rawText is required');

  let classification: ClassificationResult;
  let embedding: number[] | null = null;

  try {
    classification = await classifyText(rawText.trim());
  } catch (err) {
    logger.warn({ err }, 'Classification failed, defaulting to REVIEW');
    classification = {
      category: 'REVIEW',
      confidence: 0,
      title: rawText.slice(0, 50),
      detail: rawText,
      extracted: {},
    };
  }

  try {
    embedding = await getEmbedding(rawText.trim());
  } catch (err) {
    logger.warn({ err }, 'Embedding failed, storing without embedding');
  }

  const { data: thought, error: thoughtErr } = await supabase
    .from('sb_thoughts')
    .insert({
      raw_text: rawText.trim(),
      source,
      category: classification.category,
      confidence: classification.confidence,
      routed: false,
      embedding: embedding ?? null,
    })
    .select('id')
    .single();

  if (thoughtErr) throw new Error(`Failed to store thought: ${thoughtErr.message}`);

  let routed = false;
  if (classification.category !== 'REVIEW' && classification.confidence >= 60) {
    try {
      await routeToTable(classification, rawText.trim(), embedding);
      await supabase
        .from('sb_thoughts')
        .update({ routed: true })
        .eq('id', thought.id);
      routed = true;
    } catch (err) {
      logger.warn({ err }, 'Routing failed, thought remains in inbox');
    }
  }

  return {
    thoughtId: thought.id,
    category: classification.category,
    routed,
  };
}

async function routeToTable(
  classification: ClassificationResult,
  rawText: string,
  embedding: number[] | null,
): Promise<void> {
  if (!supabase) throw new Error('Database not configured');
  const ext = (classification.extracted ?? {}) as Record<string, unknown>;
  // pgvector expects number[] for inserts (Supabase docs), not string
  const embedVal = embedding ?? null;

  switch (classification.category) {
    case 'PROJECTS': {
      const { error } = await supabase.from('sb_projects').insert({
        name: (ext.name as string) ?? classification.title,
        goal: (ext.goal as string) ?? null,
        next_action: (ext.next_action as string) ?? null,
        due_date: (ext.due_date as string) ?? null,
        area: (ext.area as string) ?? null,
        notes: (ext.notes as string) ?? classification.detail,
        embedding: embedVal,
      });
      if (error) throw error;
      break;
    }
    case 'PEOPLE': {
      const { error } = await supabase.from('sb_people').insert({
        name: (ext.name as string) ?? classification.title,
        relationship: (ext.relationship as string) ?? null,
        notes: (ext.notes as string) ?? classification.detail,
        follow_up_date: (ext.follow_up_date as string) ?? null,
        embedding: embedVal,
      });
      if (error) throw error;
      break;
    }
    case 'IDEAS': {
      const { error } = await supabase.from('sb_ideas').insert({
        title: (ext.title as string) ?? classification.title,
        body: (ext.body as string) ?? rawText,
        area: (ext.area as string) ?? null,
        embedding: embedVal,
      });
      if (error) throw error;
      break;
    }
    case 'ADMIN': {
      const { error } = await supabase.from('sb_admin').insert({
        task: (ext.task as string) ?? classification.title,
        due_date: (ext.due_date as string) ?? null,
        notes: (ext.notes as string) ?? null,
        embedding: embedVal,
      });
      if (error) throw error;
      break;
    }
    case 'RESOURCES': {
      const tags = ext.tags;
      const tagsArr = Array.isArray(tags) ? tags.map(String) : [];
      const { error } = await supabase.from('sb_resources').insert({
        title: (ext.title as string) ?? classification.title,
        url: (ext.url as string) ?? null,
        summary: (ext.summary as string) ?? classification.detail,
        tags: tagsArr.length > 0 ? tagsArr : null,
        embedding: embedVal,
      });
      if (error) throw error;
      break;
    }
    default:
      // REVIEW stays in thoughts
      break;
  }
}

export async function semanticSearch(
  query: string,
  matchThreshold = 0.7,
  matchCount = 10,
): Promise<SearchResult[]> {
  if (!supabase) throw new Error('Database not configured');
  const embedding = await getEmbedding(query);
  const { data, error } = await supabase.rpc('sb_search_all', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });
  if (error) throw new Error(`Search failed: ${error.message}`);
  return (data ?? []) as SearchResult[];
}

export async function queryWithRag(
  question: string,
  matchCount = 5,
): Promise<string> {
  let results: SearchResult[] = [];
  try {
    results = await semanticSearch(question, 0.65, matchCount);
  } catch (err) {
    logger.warn({ err }, 'Semantic search failed, answering with empty context');
    // Continue with empty context so user gets "I don't have that stored" instead of 500
  }
  const context =
    results.length > 0
      ? results
          .map(
            (r) =>
              `[${r.table_name}] ${r.label}: ${r.detail ?? '—'}`,
          )
          .join('\n')
      : 'No relevant records found.';
  const prompt = `You are the user's Second Brain assistant. Help them retrieve and make sense of their stored knowledge.

Relevant records from their Second Brain:
${context}

Their question: ${question}

Rules:
- Use only the provided records as your source
- If the answer isn't in the records, say: "I don't have that stored yet"
- Reference specific record titles or names when useful
- Keep it brief unless depth is clearly needed
- Plain text only, no markdown`;
  try {
    return await callGeminiGenerateContent(prompt);
  } catch (err) {
    logger.warn({ err }, 'Gemini RAG generation failed');
    return "I couldn't process your question. The AI service may be unavailable—check GEMINI_API_KEY and try again.";
  }
}

type SbTable = 'sb_projects' | 'sb_people' | 'sb_ideas' | 'sb_admin' | 'sb_resources' | 'sb_thoughts';

async function listTable<T>(table: SbTable, limit = 50): Promise<T[]> {
  if (!supabase) throw new Error('Database not configured');
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to list ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function listProjects(limit?: number) {
  return listTable<Record<string, unknown>>('sb_projects', limit ?? 50);
}

export async function listPeople(limit?: number) {
  return listTable<Record<string, unknown>>('sb_people', limit ?? 50);
}

export async function listIdeas(limit?: number) {
  return listTable<Record<string, unknown>>('sb_ideas', limit ?? 50);
}

export async function listAdmin(limit?: number) {
  return listTable<Record<string, unknown>>('sb_admin', limit ?? 50);
}

export async function listResources(limit?: number) {
  return listTable<Record<string, unknown>>('sb_resources', limit ?? 50);
}

export async function listThoughts(limit?: number) {
  return listTable<Record<string, unknown>>('sb_thoughts', limit ?? 50);
}

export interface UpdateThoughtInput {
  rawText?: string;
  category?: SecondBrainCategory;
  confidence?: number;
}

export async function updateThought(
  id: string,
  input: UpdateThoughtInput,
): Promise<{ id: string }> {
  if (!supabase) throw new Error('Database not configured');
  const updates: Record<string, unknown> = {};

  if (input.rawText !== undefined) {
    const trimmed = input.rawText.trim();
    if (!trimmed) throw new Error('rawText cannot be empty');
    updates.raw_text = trimmed;
  }
  if (input.category !== undefined) updates.category = input.category;
  if (input.confidence !== undefined) updates.confidence = input.confidence;

  if (Object.keys(updates).length === 0) {
    return { id };
  }

  if (input.rawText !== undefined) {
    try {
      const embedding = await getEmbedding(input.rawText.trim());
      updates.embedding = embedding;
    } catch (err) {
      logger.warn({ err }, 'Embedding failed during update, keeping existing');
    }
  }

  const { error } = await supabase
    .from('sb_thoughts')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(`Failed to update thought: ${error.message}`);
  return { id };
}

export interface RouteThoughtResult {
  routed: boolean;
  category: SecondBrainCategory;
}

export async function routeThought(
  id: string,
  rawText?: string,
): Promise<RouteThoughtResult> {
  if (!supabase) throw new Error('Database not configured');

  let text: string;
  let thoughtRow: { raw_text: string; id: string } | null;

  if (rawText !== undefined && rawText.trim()) {
    text = rawText.trim();
    const { data: updated, error: updateErr } = await supabase
      .from('sb_thoughts')
      .update({ raw_text: text })
      .eq('id', id)
      .select('id, raw_text')
      .single();
    if (updateErr || !updated) throw new Error(`Failed to update thought: ${updateErr?.message ?? 'unknown'}`);
    thoughtRow = updated as { raw_text: string; id: string };
  } else {
    const { data, error } = await supabase
      .from('sb_thoughts')
      .select('id, raw_text')
      .eq('id', id)
      .single();
    if (error || !data) throw new Error(`Thought not found: ${error?.message ?? id}`);
    thoughtRow = data as { raw_text: string; id: string };
    text = thoughtRow.raw_text;
  }

  let classification: ClassificationResult;
  let embedding: number[] | null = null;

  try {
    classification = await classifyText(text);
  } catch (err) {
    logger.warn({ err }, 'Re-classification failed');
    throw new Error('Classification failed. Try adding a prefix (e.g. projects:, ideas:)');
  }

  try {
    embedding = await getEmbedding(text);
  } catch (err) {
    logger.warn({ err }, 'Embedding failed during route');
  }

  if (embedding) {
    await supabase.from('sb_thoughts').update({ embedding, category: classification.category, confidence: classification.confidence }).eq('id', id);
  }

  let routed = false;
  if (classification.category !== 'REVIEW' && classification.confidence >= 60) {
    try {
      await routeToTable(classification, text, embedding);
      await supabase.from('sb_thoughts').update({ routed: true }).eq('id', id);
      routed = true;
    } catch (err) {
      logger.warn({ err }, 'Routing failed, thought remains in inbox');
    }
  }

  return { routed, category: classification.category };
}

export async function deleteThought(id: string): Promise<void> {
  if (!supabase) throw new Error('Database not configured');
  const { error } = await supabase.from('sb_thoughts').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete thought: ${error.message}`);
}

export interface DigestData {
  projects: Record<string, unknown>[];
  tasksDue: Record<string, unknown>[];
  ideasRecent: Record<string, unknown>[];
}

export async function getDigestData(): Promise<DigestData> {
  if (!supabase) throw new Error('Database not configured');
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [projectsRes, tasksRes, ideasRes] = await Promise.all([
    supabase.from('sb_projects').select('name,goal,next_action,due_date').eq('status', 'active'),
    supabase.from('sb_admin').select('task,due_date').eq('status', 'pending').lte('due_date', today),
    supabase.from('sb_ideas').select('title,body').gte('created_at', sevenDaysAgo),
  ]);

  return {
    projects: (projectsRes.data ?? []) as Record<string, unknown>[],
    tasksDue: (tasksRes.data ?? []) as Record<string, unknown>[],
    ideasRecent: (ideasRes.data ?? []) as Record<string, unknown>[],
  };
}

export async function getReviewData(): Promise<{
  projectsUpdated: Record<string, unknown>[];
  tasksCompleted: Record<string, unknown>[];
  ideasNew: Record<string, unknown>[];
  peopleFollowUp: Record<string, unknown>[];
}> {
  if (!supabase) throw new Error('Database not configured');
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [projectsRes, tasksRes, ideasRes, peopleRes] = await Promise.all([
    supabase.from('sb_projects').select('*').gte('updated_at', weekAgo),
    supabase.from('sb_admin').select('*').eq('status', 'done').gte('created_at', weekAgo),
    supabase.from('sb_ideas').select('*').gte('created_at', weekAgo),
    supabase.from('sb_people').select('*').not('follow_up_date', 'is', null).lte('follow_up_date', today),
  ]);

  return {
    projectsUpdated: (projectsRes.data ?? []) as Record<string, unknown>[],
    tasksCompleted: (tasksRes.data ?? []) as Record<string, unknown>[],
    ideasNew: (ideasRes.data ?? []) as Record<string, unknown>[],
    peopleFollowUp: (peopleRes.data ?? []) as Record<string, unknown>[],
  };
}

const MORNING_DIGEST_PROMPT = `You are a supportive productivity coach delivering a personal morning briefing.

Active projects:
{{PROJECTS_JSON}}

Tasks due today or overdue:
{{TASKS_JSON}}

Ideas from the last 7 days:
{{IDEAS_JSON}}

Write a morning briefing. Rules:
1. Maximum 200 words
2. ONE big thing: if you complete this today, the day is a win
3. 2–3 supporting tasks
4. Flag anything overdue with ⚠️
5. Mention one recent idea worth revisiting if relevant
6. End with one warm, grounding sentence — not corporate, not cheesy
7. Plain text only — no markdown, easy to read in email`;

const WEEKLY_REVIEW_PROMPT = `You are a trusted advisor conducting a personal weekly review.

Projects updated this week:
{{PROJECTS_JSON}}

Tasks completed this week:
{{COMPLETED_JSON}}

New ideas captured this week:
{{IDEAS_JSON}}

People needing follow-up:
{{PEOPLE_JSON}}

Write a weekly review with these exact section headers:
WINS
STUCK
PEOPLE
FOCUS
PATTERN

Under 300 words. Tone: a trusted friend who is also well-organised.
Plain text, no markdown.`;

export async function generateMorningDigest(): Promise<string> {
  const data = await getDigestData();
  const prompt = MORNING_DIGEST_PROMPT
    .replace('{{PROJECTS_JSON}}', JSON.stringify(data.projects, null, 2))
    .replace('{{TASKS_JSON}}', JSON.stringify(data.tasksDue, null, 2))
    .replace('{{IDEAS_JSON}}', JSON.stringify(data.ideasRecent, null, 2));
  return callGeminiGenerateContent(prompt);
}

export async function generateWeeklyReview(): Promise<string> {
  const data = await getReviewData();
  const prompt = WEEKLY_REVIEW_PROMPT
    .replace('{{PROJECTS_JSON}}', JSON.stringify(data.projectsUpdated, null, 2))
    .replace('{{COMPLETED_JSON}}', JSON.stringify(data.tasksCompleted, null, 2))
    .replace('{{IDEAS_JSON}}', JSON.stringify(data.ideasNew, null, 2))
    .replace('{{PEOPLE_JSON}}', JSON.stringify(data.peopleFollowUp, null, 2));
  return callGeminiGenerateContent(prompt);
}
