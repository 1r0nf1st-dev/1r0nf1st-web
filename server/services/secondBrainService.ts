import * as secondBrainDb from '../db/secondBrainDb.js';
import type { SearchResult } from '../db/secondBrainDb.js';

export type { SearchResult };
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
  // text-embedding-004 deprecated; use gemini-embedding-001 with output_dimensionality 768
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
  const body: Record<string, unknown> = {
    model: 'models/gemini-embedding-001',
    content: { parts: [{ text: text }] },
    output_dimensionality: 768,
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
  if (!rawText?.trim()) throw new Error('rawText is required');

  let classification: ClassificationResult;
  let embedding: number[] | null = null;

  try {
    classification = await classifyText(rawText.trim());
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrainService.ts:captureThought',message:'Classification failed',data:{errMsg:err instanceof Error?err.message:'unknown'},hypothesisId:'H2',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    logger.warn({ err }, 'Classification failed, defaulting to REVIEW');
    classification = {
      category: 'REVIEW',
      confidence: 0,
      title: rawText.slice(0, 50),
      detail: rawText,
      extracted: {},
    };
  }

  // #region agent log
  fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrainService.ts:captureThought',message:'Classification result',data:{category:classification.category,confidence:classification.confidence},hypothesisId:'H2',timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  try {
    embedding = await getEmbedding(rawText.trim());
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrainService.ts:captureThought',message:'Embedding failed',data:{errMsg:err instanceof Error?err.message:'unknown'},hypothesisId:'H3',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    logger.warn({ err }, 'Embedding failed, storing without embedding');
  }

  let thought: { id: string };
  try {
    thought = await secondBrainDb.insertThought({
      raw_text: rawText.trim(),
      source,
      category: classification.category,
      confidence: classification.confidence,
      routed: false,
      embedding: embedding ?? null,
    });
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrainService.ts:captureThought',message:'insertThought failed',data:{errMsg:err instanceof Error?err.message:'unknown'},hypothesisId:'H4',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw err;
  }

  // #region agent log
  fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrainService.ts:captureThought',message:'insertThought ok',data:{thoughtId:thought.id},hypothesisId:'H4',timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  let routed = false;
  const willAttemptRoute = classification.category !== 'REVIEW' && classification.confidence >= 60;
  // #region agent log
  fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrainService.ts:captureThought',message:'Routing check',data:{willAttemptRoute,category:classification.category,confidence:classification.confidence},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (willAttemptRoute) {
    try {
      await routeToTable(classification, rawText.trim(), embedding);
      await secondBrainDb.updateThought(thought.id, { routed: true });
      routed = true;
      // #region agent log
      fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrainService.ts:captureThought',message:'routing succeeded',data:{},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7786/ingest/92ad1406-29dc-4f4f-ac56-debf92fe1219',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b680a'},body:JSON.stringify({sessionId:'3b680a',location:'secondBrainService.ts:captureThought',message:'Routing failed',data:{errMsg:err instanceof Error?err.message:'unknown'},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
  const ext = (classification.extracted ?? {}) as Record<string, unknown>;
  const embedVal = embedding ?? null;

  switch (classification.category) {
    case 'PROJECTS':
      await secondBrainDb.insertProject({
        name: (ext.name as string) ?? classification.title,
        goal: (ext.goal as string) ?? null,
        next_action: (ext.next_action as string) ?? null,
        due_date: (ext.due_date as string) ?? null,
        area: (ext.area as string) ?? null,
        notes: (ext.notes as string) ?? classification.detail,
        embedding: embedVal,
      });
      break;
    case 'PEOPLE':
      await secondBrainDb.insertPerson({
        name: (ext.name as string) ?? classification.title,
        relationship: (ext.relationship as string) ?? null,
        notes: (ext.notes as string) ?? classification.detail,
        follow_up_date: (ext.follow_up_date as string) ?? null,
        embedding: embedVal,
      });
      break;
    case 'IDEAS':
      await secondBrainDb.insertIdea({
        title: (ext.title as string) ?? classification.title,
        body: (ext.body as string) ?? rawText,
        area: (ext.area as string) ?? null,
        embedding: embedVal,
      });
      break;
    case 'ADMIN':
      await secondBrainDb.insertAdmin({
        task: (ext.task as string) ?? classification.title,
        due_date: (ext.due_date as string) ?? null,
        notes: (ext.notes as string) ?? null,
        embedding: embedVal,
      });
      break;
    case 'RESOURCES': {
      const tags = ext.tags;
      const tagsArr = Array.isArray(tags) ? tags.map(String) : [];
      await secondBrainDb.insertResource({
        title: (ext.title as string) ?? classification.title,
        url: (ext.url as string) ?? null,
        summary: (ext.summary as string) ?? classification.detail,
        tags: tagsArr.length > 0 ? tagsArr : null,
        embedding: embedVal,
      });
      break;
    }
    default:
      break;
  }
}

export async function semanticSearch(
  query: string,
  matchThreshold = 0.6,
  matchCount = 10,
): Promise<SearchResult[]> {
  const embedding = await getEmbedding(query);
  return secondBrainDb.searchAll(embedding, matchThreshold, matchCount);
}

export async function queryWithRag(
  question: string,
  matchCount = 5,
): Promise<string> {
  let results: SearchResult[] = [];
  try {
    results = await semanticSearch(question, 0.6, matchCount);
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

export async function listProjects(limit?: number) {
  return secondBrainDb.listTable<Record<string, unknown>>('sb_projects', limit ?? 50);
}

export async function listPeople(limit?: number) {
  return secondBrainDb.listTable<Record<string, unknown>>('sb_people', limit ?? 50);
}

export async function listIdeas(limit?: number) {
  return secondBrainDb.listTable<Record<string, unknown>>('sb_ideas', limit ?? 50);
}

export async function listAdmin(limit?: number) {
  return secondBrainDb.listTable<Record<string, unknown>>('sb_admin', limit ?? 50);
}

export async function listResources(limit?: number) {
  return secondBrainDb.listTable<Record<string, unknown>>('sb_resources', limit ?? 50);
}

export async function listThoughts(limit?: number) {
  return secondBrainDb.listTable<Record<string, unknown>>('sb_thoughts', limit ?? 50);
}

const PROJECT_STATUSES = ['active', 'paused', 'done'] as const;
const ADMIN_STATUSES = ['pending', 'done'] as const;
const IDEA_STATUSES = ['raw', 'developing', 'done'] as const;

export async function updateProject(
  id: string,
  input: {
    status?: (typeof PROJECT_STATUSES)[number];
    name?: string;
    goal?: string;
    next_action?: string;
    due_date?: string | null;
    area?: string | null;
    notes?: string | null;
  },
): Promise<{ id: string }> {
  const updates: Record<string, unknown> = {};
  if (input.status !== undefined && PROJECT_STATUSES.includes(input.status)) {
    updates.status = input.status;
  }
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.goal !== undefined) updates.goal = input.goal || null;
  if (input.next_action !== undefined) updates.next_action = input.next_action || null;
  if (input.due_date !== undefined) updates.due_date = input.due_date || null;
  if (input.area !== undefined) updates.area = input.area || null;
  if (input.notes !== undefined) updates.notes = input.notes || null;
  if (Object.keys(updates).length === 0) return { id };
  await secondBrainDb.updateProject(id, updates);
  return { id };
}

export async function updateAdmin(
  id: string,
  input: {
    status?: (typeof ADMIN_STATUSES)[number];
    task?: string;
    due_date?: string | null;
    notes?: string | null;
  },
): Promise<{ id: string }> {
  const updates: Record<string, unknown> = {};
  if (input.status !== undefined && ADMIN_STATUSES.includes(input.status)) {
    updates.status = input.status;
  }
  if (input.task !== undefined) updates.task = input.task.trim();
  if (input.due_date !== undefined) updates.due_date = input.due_date || null;
  if (input.notes !== undefined) updates.notes = input.notes || null;
  if (Object.keys(updates).length === 0) return { id };
  await secondBrainDb.updateAdmin(id, updates);
  return { id };
}

export async function updateIdea(
  id: string,
  input: {
    status?: (typeof IDEA_STATUSES)[number];
    title?: string;
    body?: string | null;
    area?: string | null;
  },
): Promise<{ id: string }> {
  const updates: Record<string, unknown> = {};
  if (input.status !== undefined && IDEA_STATUSES.includes(input.status)) {
    updates.status = input.status;
  }
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.body !== undefined) updates.body = input.body || null;
  if (input.area !== undefined) updates.area = input.area || null;
  if (Object.keys(updates).length === 0) return { id };
  await secondBrainDb.updateIdea(id, updates);
  return { id };
}

async function backfillEmbeddingsForTable(
  table: secondBrainDb.SbTable,
  selectColumns: string,
  buildText: (row: Record<string, unknown>) => string,
  batchSize = 50,
): Promise<number> {
  let updatedCount = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await secondBrainDb.selectRowsNullEmbedding(table, selectColumns, batchSize);
    if (rows.length === 0) break;

    for (const row of rows) {
      const id = row.id as string | undefined;
      if (!id) continue;
      const text = buildText(row).trim();
      if (!text) continue;
      try {
        const embedding = await getEmbedding(text);
        await secondBrainDb.updateRowEmbedding(table, id, embedding);
        updatedCount += 1;
      } catch (err) {
        logger.warn({ table, id, err }, 'Error computing embedding during backfill');
      }
    }
    if (rows.length < batchSize) break;
  }
  return updatedCount;
}

export async function backfillSecondBrainEmbeddings(): Promise<{
  projects: number;
  people: number;
  ideas: number;
  admin: number;
  resources: number;
}> {
  const [projects, people, ideas, admin, resources] = await Promise.all([
    backfillEmbeddingsForTable(
      'sb_projects',
      'id, name, goal, notes',
      (row) =>
        `${row.name ?? ''}\n${row.goal ?? ''}\n${row.notes ?? ''}`,
    ),
    backfillEmbeddingsForTable(
      'sb_people',
      'id, name, relationship, notes',
      (row) =>
        `${row.name ?? ''}\n${row.relationship ?? ''}\n${row.notes ?? ''}`,
    ),
    backfillEmbeddingsForTable(
      'sb_ideas',
      'id, title, body, area',
      (row) =>
        `${row.title ?? ''}\n${row.body ?? ''}\n${row.area ?? ''}`,
    ),
    backfillEmbeddingsForTable(
      'sb_admin',
      'id, task, notes',
      (row) =>
        `${row.task ?? ''}\n${row.notes ?? ''}`,
    ),
    backfillEmbeddingsForTable(
      'sb_resources',
      'id, title, summary, url, tags',
      (row) =>
        `${row.title ?? ''}\n${row.summary ?? ''}\n${row.url ?? ''}\n${Array.isArray(row.tags) ? row.tags.join(', ') : ''}`,
    ),
  ]);

  return { projects, people, ideas, admin, resources };
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

  await secondBrainDb.updateThought(id, updates);
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
  let text: string;

  if (rawText !== undefined && rawText.trim()) {
    text = rawText.trim();
    await secondBrainDb.updateThought(id, { raw_text: text });
  } else {
    const thoughtRow = await secondBrainDb.getThought(id);
    if (!thoughtRow) throw new Error(`Thought not found: ${id}`);
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
    await secondBrainDb.updateThought(id, {
      embedding,
      category: classification.category,
      confidence: classification.confidence,
    });
  }

  let routed = false;
  if (classification.category !== 'REVIEW' && classification.confidence >= 60) {
    try {
      await routeToTable(classification, text, embedding);
      await secondBrainDb.updateThought(id, { routed: true });
      routed = true;
    } catch (err) {
      logger.warn({ err }, 'Routing failed, thought remains in inbox');
    }
  }

  return { routed, category: classification.category };
}

export async function deleteThought(id: string): Promise<void> {
  await secondBrainDb.deleteThought(id);
}

export interface DigestData {
  projects: Record<string, unknown>[];
  tasksDue: Record<string, unknown>[];
  ideasRecent: Record<string, unknown>[];
}

export async function getDigestData(): Promise<DigestData> {
  return secondBrainDb.getDigestData();
}

export async function getReviewData(): Promise<{
  projectsUpdated: Record<string, unknown>[];
  tasksCompleted: Record<string, unknown>[];
  ideasNew: Record<string, unknown>[];
  peopleFollowUp: Record<string, unknown>[];
}> {
  return secondBrainDb.getReviewData();
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
