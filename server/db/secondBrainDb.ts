/**
 * Second Brain data access layer.
 * Isolates all Supabase access for sb_* tables. Services use this module
 * instead of importing supabase directly.
 */
import { supabase } from './supabase.js';

export type SbTable =
  | 'sb_projects'
  | 'sb_people'
  | 'sb_ideas'
  | 'sb_admin'
  | 'sb_resources'
  | 'sb_thoughts';

export interface SearchResult {
  table_name: string;
  record_id: string;
  label: string;
  detail: string | null;
  similarity: number;
  created_at: string;
}

function requireDb(): NonNullable<typeof supabase> {
  if (!supabase) throw new Error('Database not configured');
  return supabase;
}

export interface InsertThoughtData {
  raw_text: string;
  source: string;
  category: string;
  confidence: number;
  routed: boolean;
  embedding: number[] | null;
}

export async function insertThought(data: InsertThoughtData): Promise<{ id: string }> {
  const db = requireDb();
  const { data: thought, error } = await db
    .from('sb_thoughts')
    .insert(data)
    .select('id')
    .single();
  if (error) throw new Error(`Failed to store thought: ${error.message}`);
  return { id: thought.id };
}

export async function updateThought(id: string, updates: Record<string, unknown>): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_thoughts').update(updates).eq('id', id);
  if (error) throw new Error(`Failed to update thought: ${error.message}`);
}

export async function deleteThought(id: string): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_thoughts').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete thought: ${error.message}`);
}

export async function getThought(id: string): Promise<{ id: string; raw_text: string } | null> {
  const db = requireDb();
  const { data, error } = await db.from('sb_thoughts').select('id, raw_text').eq('id', id).single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to fetch thought: ${error.message}`);
  return data as { id: string; raw_text: string };
}

export interface InsertProjectData {
  name: string;
  goal?: string | null;
  next_action?: string | null;
  due_date?: string | null;
  area?: string | null;
  notes?: string | null;
  embedding?: number[] | null;
}

export async function insertProject(data: InsertProjectData): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_projects').insert(data);
  if (error) throw error;
}

export interface InsertPersonData {
  name: string;
  relationship?: string | null;
  notes?: string | null;
  follow_up_date?: string | null;
  embedding?: number[] | null;
}

export async function insertPerson(data: InsertPersonData): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_people').insert(data);
  if (error) throw error;
}

export interface InsertIdeaData {
  title: string;
  body?: string;
  area?: string | null;
  embedding?: number[] | null;
}

export async function insertIdea(data: InsertIdeaData): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_ideas').insert(data);
  if (error) throw error;
}

export interface InsertAdminData {
  task: string;
  due_date?: string | null;
  notes?: string | null;
  embedding?: number[] | null;
}

export async function insertAdmin(data: InsertAdminData): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_admin').insert(data);
  if (error) throw error;
}

export interface InsertResourceData {
  title: string;
  url?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  embedding?: number[] | null;
}

export async function insertResource(data: InsertResourceData): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_resources').insert(data);
  if (error) throw error;
}

export async function searchAll(
  queryEmbedding: number[],
  matchThreshold: number,
  matchCount: number,
): Promise<SearchResult[]> {
  const db = requireDb();
  const { data, error } = await db.rpc('sb_search_all', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });
  if (error) throw new Error(`Search failed: ${error.message}`);
  return (data ?? []) as SearchResult[];
}

export async function listTable<T>(table: SbTable, limit = 50): Promise<T[]> {
  const db = requireDb();
  const { data, error } = await db
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to list ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function updateProject(
  id: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_projects').update(updates).eq('id', id);
  if (error) throw new Error(`Failed to update project: ${error.message}`);
}

export async function updateAdmin(id: string, updates: Record<string, unknown>): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_admin').update(updates).eq('id', id);
  if (error) throw new Error(`Failed to update task: ${error.message}`);
}

export async function updateIdea(id: string, updates: Record<string, unknown>): Promise<void> {
  const db = requireDb();
  const { error } = await db.from('sb_ideas').update(updates).eq('id', id);
  if (error) throw new Error(`Failed to update idea: ${error.message}`);
}

export async function selectRowsNullEmbedding(
  table: SbTable,
  columns: string,
  limit: number,
): Promise<Record<string, unknown>[]> {
  const db = requireDb();
  const { data, error } = await db
    .from(table)
    .select(`${columns}, embedding`)
    .is('embedding', null)
    .limit(limit);
  if (error) throw new Error(`Failed to load ${table} rows: ${error.message}`);
  return (data ?? []) as unknown as Record<string, unknown>[];
}

export async function updateRowEmbedding(
  table: SbTable,
  id: string,
  embedding: number[],
): Promise<void> {
  const db = requireDb();
  const { error } = await db.from(table).update({ embedding }).eq('id', id);
  if (error) throw new Error(`Failed to update embedding: ${error.message}`);
}

export async function getDigestData(): Promise<{
  projects: Record<string, unknown>[];
  tasksDue: Record<string, unknown>[];
  ideasRecent: Record<string, unknown>[];
}> {
  const db = requireDb();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [projectsRes, tasksRes, ideasRes] = await Promise.all([
    db.from('sb_projects').select('name,goal,next_action,due_date').eq('status', 'active'),
    db.from('sb_admin').select('task,due_date').eq('status', 'pending').lte('due_date', today),
    db.from('sb_ideas').select('title,body').gte('created_at', sevenDaysAgo),
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
  const db = requireDb();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [projectsRes, tasksRes, ideasRes, peopleRes] = await Promise.all([
    db.from('sb_projects').select('*').gte('updated_at', weekAgo),
    db.from('sb_admin').select('*').eq('status', 'done').gte('created_at', weekAgo),
    db.from('sb_ideas').select('*').gte('created_at', weekAgo),
    db.from('sb_people').select('*').not('follow_up_date', 'is', null).lte('follow_up_date', today),
  ]);

  return {
    projectsUpdated: (projectsRes.data ?? []) as Record<string, unknown>[],
    tasksCompleted: (tasksRes.data ?? []) as Record<string, unknown>[],
    ideasNew: (ideasRes.data ?? []) as Record<string, unknown>[],
    peopleFollowUp: (peopleRes.data ?? []) as Record<string, unknown>[],
  };
}
