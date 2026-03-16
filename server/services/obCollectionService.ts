import type { SupabaseClient } from '@supabase/supabase-js';
import type { ObVisibility } from './obNodeService.js';

export interface ObCollectionRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  visibility: ObVisibility;
  cover_node_id: string | null;
  created_at: string;
}

export interface ObNodeCollectionRow {
  node_id: string;
  collection_id: string;
  position: number;
  added_at: string;
}

const OB_COLLECTIONS = 'ob_collections';
const OB_NODE_COLLECTIONS = 'ob_node_collections';

export async function listObCollections(
  db: SupabaseClient,
  userId: string,
): Promise<ObCollectionRow[]> {
  const { data, error } = await db
    .from(OB_COLLECTIONS)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ObCollectionRow[];
}

export async function getObCollection(
  db: SupabaseClient,
  collectionId: string,
  userId: string,
): Promise<ObCollectionRow | null> {
  const { data, error } = await db
    .from(OB_COLLECTIONS)
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as ObCollectionRow;
}

export async function createObCollection(
  db: SupabaseClient,
  userId: string,
  insert: { name: string; description?: string | null; visibility?: ObVisibility },
): Promise<ObCollectionRow> {
  const { data, error } = await db
    .from(OB_COLLECTIONS)
    .insert({
      user_id: userId,
      name: insert.name,
      description: insert.description ?? null,
      visibility: insert.visibility ?? 'private',
    })
    .select()
    .single();
  if (error) throw error;
  return data as ObCollectionRow;
}

export async function updateObCollection(
  db: SupabaseClient,
  collectionId: string,
  userId: string,
  update: {
    name?: string;
    description?: string | null;
    visibility?: ObVisibility;
    cover_node_id?: string | null;
  },
): Promise<ObCollectionRow> {
  const { data, error } = await db
    .from(OB_COLLECTIONS)
    .update(update)
    .eq('id', collectionId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Collection not found');
  return data as ObCollectionRow;
}

export async function deleteObCollection(
  db: SupabaseClient,
  collectionId: string,
  userId: string,
): Promise<void> {
  const { error } = await db
    .from(OB_COLLECTIONS)
    .delete()
    .eq('id', collectionId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function addNodeToCollection(
  db: SupabaseClient,
  collectionId: string,
  nodeId: string,
  userId: string,
  position = 0,
): Promise<ObNodeCollectionRow> {
  const coll = await getObCollection(db, collectionId, userId);
  if (!coll) throw new Error('Collection not found');
  const { data, error } = await db
    .from(OB_NODE_COLLECTIONS)
    .insert({ collection_id: collectionId, node_id: nodeId, position })
    .select()
    .single();
  if (error) throw error;
  return data as ObNodeCollectionRow;
}

export async function removeNodeFromCollection(
  db: SupabaseClient,
  collectionId: string,
  nodeId: string,
  userId: string,
): Promise<void> {
  const coll = await getObCollection(db, collectionId, userId);
  if (!coll) throw new Error('Collection not found');
  const { error } = await db
    .from(OB_NODE_COLLECTIONS)
    .delete()
    .eq('collection_id', collectionId)
    .eq('node_id', nodeId);
  if (error) throw error;
}

export async function listNodesInCollection(
  db: SupabaseClient,
  collectionId: string,
): Promise<ObNodeCollectionRow[]> {
  const { data, error } = await db
    .from(OB_NODE_COLLECTIONS)
    .select('*')
    .eq('collection_id', collectionId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ObNodeCollectionRow[];
}
