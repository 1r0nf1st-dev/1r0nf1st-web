/**
 * Notes data access layer.
 * Accepts SupabaseClient so callers can pass user-scoped (req.supabase) or service-role client.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: Record<string, unknown>;
  content_text: string | null;
  notebook_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_pinned: boolean;
  is_archived: boolean;
}

export interface NoteTagRow {
  tag_id: string;
}

export interface TagRow {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface AttachmentRow {
  id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

export async function selectNoteById(
  db: SupabaseClient,
  noteId: string,
  userId: string,
): Promise<NoteRow | null> {
  const { data, error } = await db
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to fetch note: ${error.message}`);
  return data as NoteRow;
}

export async function selectNoteTags(
  db: SupabaseClient,
  noteId: string,
): Promise<NoteTagRow[]> {
  const { data, error } = await db.from('note_tags').select('tag_id').eq('note_id', noteId);
  if (error) throw new Error(`Failed to fetch note tags: ${error.message}`);
  return (data ?? []) as NoteTagRow[];
}

export async function selectTagsByIds(
  db: SupabaseClient,
  ids: string[],
): Promise<TagRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from('tags').select('*').in('id', ids);
  if (error) throw new Error(`Failed to fetch tags: ${error.message}`);
  return (data ?? []) as TagRow[];
}

export async function selectAttachmentsByNoteId(
  db: SupabaseClient,
  noteId: string,
): Promise<AttachmentRow[]> {
  const { data, error } = await db
    .from('attachments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to fetch attachments: ${error.message}`);
  return (data ?? []) as AttachmentRow[];
}

export interface InsertNoteData {
  user_id: string;
  title: string;
  content: Record<string, unknown>;
  notebook_id: string | null;
  is_pinned: boolean;
  is_archived: boolean;
}

export async function insertNote(db: SupabaseClient, data: InsertNoteData): Promise<NoteRow> {
  const { data: note, error } = await db
    .from('notes')
    .insert(data)
    .select()
    .single();
  if (error) throw new Error(`Failed to create note: ${error.message}`);
  return note as NoteRow;
}

export async function insertNoteTags(
  db: SupabaseClient,
  rows: { note_id: string; tag_id: string }[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await db.from('note_tags').insert(rows);
  if (error) throw new Error(`Failed to link tags: ${error.message}`);
}

export async function selectUserTagIds(
  db: SupabaseClient,
  userId: string,
  tagIds: string[],
): Promise<string[]> {
  if (tagIds.length === 0) return [];
  const { data, error } = await db
    .from('tags')
    .select('id')
    .eq('user_id', userId)
    .in('id', tagIds);
  if (error) throw new Error(`Failed to verify tags: ${error.message}`);
  return (data ?? []).map((r: { id: string }) => r.id);
}

export async function updateNote(
  db: SupabaseClient,
  noteId: string,
  userId: string,
  updates: Partial<Pick<NoteRow, 'title' | 'content' | 'notebook_id' | 'is_pinned' | 'is_archived'>>,
): Promise<NoteRow> {
  const { data, error } = await db
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(`Failed to update note: ${error.message}`);
  return data as NoteRow;
}

export async function softDeleteNote(
  db: SupabaseClient,
  noteId: string,
  userId: string,
): Promise<void> {
  const { error } = await db
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('user_id', userId);
  if (error) throw new Error(`Failed to delete note: ${error.message}`);
}

export async function deleteNoteTags(
  db: SupabaseClient,
  noteId: string,
): Promise<void> {
  const { error } = await db.from('note_tags').delete().eq('note_id', noteId);
  if (error) throw new Error(`Failed to remove existing tags: ${error.message}`);
}
