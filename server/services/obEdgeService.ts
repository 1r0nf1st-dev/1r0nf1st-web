import type { SupabaseClient } from '@supabase/supabase-js';

export type ObEdgeType = 'supports' | 'contradicts' | 'extends' | 'inspired_by' | 'references';

export interface ObEdgeRow {
  id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: ObEdgeType;
  created_by: 'user' | 'ai';
  weight: number;
  created_at: string;
}

const OB_EDGES = 'ob_edges';

export async function listObEdges(
  db: SupabaseClient,
  options: { fromNodeId?: string; toNodeId?: string },
): Promise<ObEdgeRow[]> {
  let query = db.from(OB_EDGES).select('*').order('created_at', { ascending: false });
  if (options.fromNodeId) {
    query = query.eq('from_node_id', options.fromNodeId);
  }
  if (options.toNodeId) {
    query = query.eq('to_node_id', options.toNodeId);
  }
  const { data, error } = await query.limit(200);
  if (error) throw error;
  return (data ?? []) as ObEdgeRow[];
}

/**
 * List edges where both from_node_id and to_node_id are in the given set (for graph view).
 */
export async function listObEdgesForNodeIds(
  db: SupabaseClient,
  nodeIds: string[],
): Promise<ObEdgeRow[]> {
  if (nodeIds.length === 0) return [];
  const { data, error } = await db
    .from(OB_EDGES)
    .select('*')
    .in('from_node_id', nodeIds)
    .in('to_node_id', nodeIds)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as ObEdgeRow[];
}

export async function createObEdge(
  db: SupabaseClient,
  fromNodeId: string,
  toNodeId: string,
  edgeType: ObEdgeType,
  createdBy: 'user' | 'ai' = 'user',
  weight = 1,
): Promise<ObEdgeRow> {
  if (fromNodeId === toNodeId) {
    throw new Error('from_node_id and to_node_id must differ');
  }
  const { data, error } = await db
    .from(OB_EDGES)
    .insert({
      from_node_id: fromNodeId,
      to_node_id: toNodeId,
      edge_type: edgeType,
      created_by: createdBy,
      weight: Math.min(1, Math.max(0, weight)),
    })
    .select()
    .single();
  if (error) throw error;
  return data as ObEdgeRow;
}

export async function deleteObEdge(db: SupabaseClient, edgeId: string): Promise<void> {
  const { error } = await db.from(OB_EDGES).delete().eq('id', edgeId);
  if (error) throw error;
}

export async function getObEdge(db: SupabaseClient, edgeId: string): Promise<ObEdgeRow | null> {
  const { data, error } = await db.from(OB_EDGES).select('*').eq('id', edgeId).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as ObEdgeRow;
}
