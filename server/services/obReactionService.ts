import type { SupabaseClient } from '@supabase/supabase-js';

export type ObReactionType = 'resonates' | 'challenges' | 'expands' | 'bookmarks';

export interface ObReactionRow {
  id: string;
  node_id: string;
  user_id: string;
  type: ObReactionType;
  note: string | null;
  created_at: string;
}

const OB_REACTIONS = 'ob_reactions';

export async function listObReactionsByNode(
  db: SupabaseClient,
  nodeId: string,
): Promise<ObReactionRow[]> {
  const { data, error } = await db
    .from(OB_REACTIONS)
    .select('*')
    .eq('node_id', nodeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ObReactionRow[];
}

export async function upsertObReaction(
  db: SupabaseClient,
  nodeId: string,
  userId: string,
  type: ObReactionType,
  note?: string | null,
): Promise<ObReactionRow> {
  const { data, error } = await db
    .from(OB_REACTIONS)
    .upsert(
      {
        node_id: nodeId,
        user_id: userId,
        type,
        note: note ?? null,
      },
      {
        onConflict: 'node_id,user_id,type',
        ignoreDuplicates: false,
      },
    )
    .select()
    .single();
  if (error) throw error;
  return data as ObReactionRow;
}

export async function deleteObReaction(
  db: SupabaseClient,
  nodeId: string,
  userId: string,
  type: ObReactionType,
): Promise<void> {
  const { error } = await db
    .from(OB_REACTIONS)
    .delete()
    .eq('node_id', nodeId)
    .eq('user_id', userId)
    .eq('type', type);
  if (error) throw error;
}

export async function getObReaction(
  db: SupabaseClient,
  nodeId: string,
  userId: string,
  type: ObReactionType,
): Promise<ObReactionRow | null> {
  const { data, error } = await db
    .from(OB_REACTIONS)
    .select('*')
    .eq('node_id', nodeId)
    .eq('user_id', userId)
    .eq('type', type)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as ObReactionRow;
}
