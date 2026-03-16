import type { SupabaseClient } from '@supabase/supabase-js';

/** OpenBrain node type (matches ob_node_type enum). */
export type ObNodeType =
  | 'note'
  | 'concept'
  | 'question'
  | 'source'
  | 'project';

/** OpenBrain visibility (matches ob_visibility enum). */
export type ObVisibility = 'public' | 'private' | 'shared';

export interface ObNodeRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  node_type: ObNodeType;
  visibility: ObVisibility;
  embedding: number[] | null;
  ai_summary: string | null;
  ai_tags: string[];
  user_tags: string[];
  source_url: string | null;
  linked_note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ObNodeInsert {
  user_id: string;
  title: string;
  body?: string | null;
  node_type?: ObNodeType;
  visibility?: ObVisibility;
  source_url?: string | null;
  linked_note_id?: string | null;
  user_tags?: string[];
}

export interface ObNodeUpdate {
  title?: string;
  body?: string | null;
  node_type?: ObNodeType;
  visibility?: ObVisibility;
  source_url?: string | null;
  linked_note_id?: string | null;
  user_tags?: string[];
}

const OB_NODES = 'ob_nodes';
const OB_PROFILES = 'ob_profiles';

export interface ObProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  brain_slug: string;
  bio: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

/**
 * Get ob_profile by brain_slug (public). Returns null if not found.
 */
export async function getObProfileByBrainSlug(
  db: SupabaseClient,
  brainSlug: string,
): Promise<ObProfileRow | null> {
  const { data, error } = await db
    .from(OB_PROFILES)
    .select('id, username, display_name, brain_slug, bio, settings, created_at')
    .eq('brain_slug', brainSlug)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as ObProfileRow;
}

/**
 * Get ob_profile by user id (for current user's profile). Returns null if not found.
 */
export async function getObProfileByUserId(
  db: SupabaseClient,
  userId: string,
): Promise<ObProfileRow | null> {
  const { data, error } = await db
    .from(OB_PROFILES)
    .select('id, username, display_name, brain_slug, bio, settings, created_at')
    .eq('id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as ObProfileRow;
}

/**
 * List public ob_nodes for a given owner (user_id). Used for public brain viewer.
 */
export async function listPublicObNodesForOwner(
  db: SupabaseClient,
  ownerId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<ObNodeRow[]> {
  const { limit = 50, offset = 0 } = options;
  const { data, error } = await db
    .from(OB_NODES)
    .select('*')
    .eq('user_id', ownerId)
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as ObNodeRow[];
}

/**
 * List ob_nodes for the authenticated user (RLS enforces ownership).
 */
export async function listObNodes(
  db: SupabaseClient,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    node_type?: ObNodeType;
    visibility?: ObVisibility;
  } = {},
): Promise<ObNodeRow[]> {
  const { limit = 50, offset = 0, node_type, visibility } = options;
  let query = db
    .from(OB_NODES)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (node_type) {
    query = query.eq('node_type', node_type);
  }
  if (visibility) {
    query = query.eq('visibility', visibility);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ObNodeRow[];
}

/**
 * Get a single ob_node by id. RLS ensures user can only read own or public nodes.
 */
export async function getObNode(
  db: SupabaseClient,
  nodeId: string,
): Promise<ObNodeRow | null> {
  const { data, error } = await db
    .from(OB_NODES)
    .select('*')
    .eq('id', nodeId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as ObNodeRow;
}

/**
 * Create an ob_node. RLS ensures user_id matches auth.uid().
 */
export async function createObNode(
  db: SupabaseClient,
  insert: ObNodeInsert,
): Promise<ObNodeRow> {
  const row = {
    ...insert,
    user_tags: insert.user_tags ?? [],
  };
  const { data, error } = await db.from(OB_NODES).insert(row).select().single();
  if (error) throw error;
  return data as ObNodeRow;
}

/**
 * Update an ob_node. RLS ensures only owner can update.
 */
export async function updateObNode(
  db: SupabaseClient,
  nodeId: string,
  userId: string,
  update: ObNodeUpdate,
): Promise<ObNodeRow> {
  const { data, error } = await db
    .from(OB_NODES)
    .update(update)
    .eq('id', nodeId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Node not found');
  return data as ObNodeRow;
}

/**
 * Delete an ob_node. RLS ensures only owner can delete.
 */
export async function deleteObNode(
  db: SupabaseClient,
  nodeId: string,
  userId: string,
): Promise<void> {
  const { error } = await db
    .from(OB_NODES)
    .delete()
    .eq('id', nodeId)
    .eq('user_id', userId);
  if (error) throw error;
}
