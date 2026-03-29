import type { SupabaseClient } from '@supabase/supabase-js';

const TABLE = 'ob_node_attachments';

export async function insertObNodeAttachment(
  db: SupabaseClient,
  params: {
    nodeId: string;
    userId: string;
    file_path: string;
    file_name: string;
    file_type: string;
    file_size: number;
    mime_type: string | null;
  },
): Promise<{ id: string }> {
  const { data, error } = await db
    .from(TABLE)
    .insert({
      node_id: params.nodeId,
      user_id: params.userId,
      file_path: params.file_path,
      file_name: params.file_name,
      file_type: params.file_type,
      file_size: params.file_size,
      mime_type: params.mime_type,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to save node attachment: ${error.message}`);
  return { id: (data as { id: string }).id };
}

export async function getObNodeAttachmentForUser(
  db: SupabaseClient,
  attachmentId: string,
  userId: string,
): Promise<{
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
} | null> {
  const { data, error } = await db
    .from(TABLE)
    .select('id, file_path, file_name, mime_type, user_id')
    .eq('id', attachmentId)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  const row = data as {
    user_id: string;
    id: string;
    file_path: string;
    file_name: string;
    mime_type: string | null;
  };
  if (row.user_id !== userId) return null;
  return {
    id: row.id,
    file_path: row.file_path,
    file_name: row.file_name,
    mime_type: row.mime_type,
  };
}
