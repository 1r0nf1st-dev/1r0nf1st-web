import type { SupabaseClient } from '@supabase/supabase-js';
import * as notesDb from '../db/notesDb.js';
import { supabase } from '../db/supabase.js';
import { extractNoteIdsFromContent } from '../utils/noteLinks.js';

export interface Note {
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
  tags?: Tag[];
  attachments?: Attachment[];
}

export interface Notebook {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

export interface NoteVersion {
  id: string;
  note_id: string;
  content: Record<string, unknown>;
  content_text: string | null;
  version_number: number;
  created_at: string;
}

export interface SharedNote {
  id: string;
  note_id: string;
  owner_id: string;
  shared_with_user_id: string | null;
  share_token: string;
  permission: 'view' | 'edit';
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  // Populated fields
  note?: Note;
  shared_with_user?: {
    id: string;
    email?: string;
    username?: string;
  };
  owner?: {
    id: string;
    email?: string;
    username?: string;
  };
}

export interface CreateShareInput {
  shared_with_user_id?: string; // Can be UUID or email
  shared_with_user_email?: string; // Alternative: email address
  permission?: 'view' | 'edit';
  expires_at?: string;
}

export interface CreateNoteInput {
  title?: string;
  content?: Record<string, unknown>;
  notebook_id?: string;
  tag_ids?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: Record<string, unknown>;
  notebook_id?: string | null;
  tag_ids?: string[];
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface CreateNotebookInput {
  name: string;
  parent_id?: string;
  color?: string;
}

export interface UpdateNotebookInput {
  name?: string;
  parent_id?: string | null;
  color?: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}

export interface NotesFilters {
  notebook_id?: string;
  tag_id?: string;
  search?: string;
  archived?: boolean;
  pinned?: boolean;
}

/** Parsed search operators: tag:name, notebook:name, is:archived|active. Remaining text used for full-text search. */
export interface ParsedSearchOperators {
  tagName?: string;
  notebookName?: string;
  archived?: boolean;
  text: string;
}

/**
 * Parse search query for operators: tag:X, notebook:X, is:archived, is:active.
 * Supports quoted values for multi-word: tag:"work stuff".
 */
export function parseSearchOperators(search: string): ParsedSearchOperators {
  const result: ParsedSearchOperators = { text: '' };
  if (!search || typeof search !== 'string') return result;

  let remaining = search.trim();
  const used: string[] = [];

  // is:archived or is:active
  const isMatch = remaining.match(/\bis:(archived|active)\b/gi);
  if (isMatch) {
    const last = isMatch[isMatch.length - 1];
    result.archived = last.toLowerCase().endsWith('archived');
    used.push(...isMatch);
  }

  // tag:"quoted" or tag:word
  const tagQuoted = remaining.match(/\btag:"([^"]*)"\s*/g);
  const tagWord = remaining.match(/\btag:(\S+)\s*/g);
  if (tagQuoted?.length) {
    const m = tagQuoted[tagQuoted.length - 1].match(/\btag:"([^"]*)"/);
    if (m) result.tagName = m[1].trim();
    used.push(...tagQuoted);
  } else if (tagWord?.length) {
    const m = tagWord[tagWord.length - 1].match(/\btag:(\S+)/);
    if (m) result.tagName = m[1].trim();
    used.push(...tagWord);
  }

  // notebook:"quoted" or notebook:word
  const nbQuoted = remaining.match(/\bnotebook:"([^"]*)"\s*/g);
  const nbWord = remaining.match(/\bnotebook:(\S+)\s*/g);
  if (nbQuoted?.length) {
    const m = nbQuoted[nbQuoted.length - 1].match(/\bnotebook:"([^"]*)"/);
    if (m) result.notebookName = m[1].trim();
    used.push(...nbQuoted);
  } else if (nbWord?.length) {
    const m = nbWord[nbWord.length - 1].match(/\bnotebook:(\S+)/);
    if (m) result.notebookName = m[1].trim();
    used.push(...nbWord);
  }

  // Remove used tokens to get remaining search text
  for (const u of used) {
    remaining = remaining.replace(u, ' ');
  }
  result.text = remaining.replace(/\s+/g, ' ').trim();
  return result;
}

// ========== Notes CRUD ==========

export async function getNotesByUserId(
  db: SupabaseClient,
  userId: string,
  filters?: NotesFilters,
): Promise<Note[]> {
  let query = db.from('notes').select('*').eq('user_id', userId).is('deleted_at', null);

  if (filters?.notebook_id) {
    query = query.eq('notebook_id', filters.notebook_id);
  }

  if (filters?.archived !== undefined) {
    query = query.eq('is_archived', filters.archived);
  } else {
    // By default, exclude archived notes unless explicitly requested
    query = query.eq('is_archived', false);
  }

  if (filters?.pinned !== undefined) {
    query = query.eq('is_pinned', filters.pinned);
  }

  // Order: pinned first, then by updated_at descending
  query = query.order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`);
  }

  let notes = (data || []) as Note[];

  // Filter by tag if specified
  if (filters?.tag_id) {
    // Get all note_ids that have this tag
    const { data: noteTags, error: tagError } = await db
      .from('note_tags')
      .select('note_id')
      .eq('tag_id', filters.tag_id);

    if (tagError) {
      throw new Error(`Failed to fetch note tags: ${tagError.message}`);
    }

    // Filter notes to only those that have this tag AND belong to the user
    // (the notes array already contains only user's notes, so we just need to check tag membership)
    const noteIdsWithTag = new Set((noteTags || []).map((nt) => nt.note_id));
    const originalCount = notes.length;
    notes = notes.filter((note) => noteIdsWithTag.has(note.id));

    // Log for debugging
    const { logger } = await import('../utils/logger.js');
    logger.debug(
      {
        tagId: filters.tag_id,
        notesBeforeFilter: originalCount,
        noteIdsWithTag: noteIdsWithTag.size,
        notesAfterFilter: notes.length,
      },
      'Filtered notes by tag',
    );
  }

  // Full-text search if specified
  if (filters?.search) {
    // Use simple case-insensitive search on title and content_text
    // This works better than PostgreSQL textSearch for partial matches
    const searchLower = filters.search.toLowerCase().trim();
    if (searchLower) {
      notes = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchLower) ||
          (note.content_text && note.content_text.toLowerCase().includes(searchLower)),
      );
    }
  }

  // Load tags for all notes (for display purposes)
  if (notes.length > 0) {
    const noteIds = notes.map((n) => n.id);
    const { data: noteTags, error: tagsError } = await db
      .from('note_tags')
      .select('note_id, tag_id')
      .in('note_id', noteIds);

    if (!tagsError && noteTags && noteTags.length > 0) {
      // Group tags by note_id
      const tagsByNoteId = new Map<string, string[]>();
      for (const nt of noteTags) {
        if (!tagsByNoteId.has(nt.note_id)) {
          tagsByNoteId.set(nt.note_id, []);
        }
        tagsByNoteId.get(nt.note_id)!.push(nt.tag_id);
      }

      // Fetch all tag details
      const allTagIds = Array.from(new Set(noteTags.map((nt) => nt.tag_id)));
      if (allTagIds.length > 0) {
        const { data: tags, error: fetchTagsError } = await db
          .from('tags')
          .select('*')
          .in('id', allTagIds)
          .eq('user_id', userId);

        if (!fetchTagsError && tags) {
          const tagsMap = new Map(tags.map((t) => [t.id, t]));
          // Attach tags to each note
          for (const note of notes) {
            const tagIds = tagsByNoteId.get(note.id) || [];
            note.tags = tagIds
              .map((tid) => tagsMap.get(tid))
              .filter((t): t is Tag => t !== undefined);
          }
        }
      }
    }
  }

  return notes;
}

export async function getNoteById(
  db: SupabaseClient,
  noteId: string,
  userId: string,
): Promise<Note | null> {
  const noteRow = await notesDb.selectNoteById(db, noteId, userId);
  if (!noteRow) return null;

  const note = noteRow as Note;

  const noteTags = await notesDb.selectNoteTags(db, noteId);
  if (noteTags.length > 0) {
    const tagIds = noteTags.map((nt) => nt.tag_id);
    const tags = await notesDb.selectTagsByIds(db, tagIds);
    note.tags = tags as Tag[];
  }

  const attachments = await notesDb.selectAttachmentsByNoteId(db, noteId);
  note.attachments = attachments as Attachment[];

  return note;
}

export async function createNote(
  db: SupabaseClient,
  userId: string,
  input: CreateNoteInput,
): Promise<Note> {
  const note = await notesDb.insertNote(db, {
    user_id: userId,
    title: input.title || '',
    content: input.content || {},
    notebook_id: input.notebook_id || null,
    is_pinned: false,
    is_archived: false,
  }) as Note;

  if (input.tag_ids && input.tag_ids.length > 0) {
    const validTagIds = await notesDb.selectUserTagIds(db, userId, input.tag_ids);
    if (validTagIds.length > 0) {
      await notesDb.insertNoteTags(
        db,
        validTagIds.map((tagId) => ({ note_id: note.id, tag_id: tagId })),
      );
    }
  }

  return note;
}

export async function updateNote(
  db: SupabaseClient,
  noteId: string,
  userId: string,
  input: UpdateNoteInput,
): Promise<Note> {
  const existingNote = await getNoteById(db, noteId, userId);
  if (!existingNote) {
    throw new Error('Note not found or access denied');
  }

  const updateData: Partial<notesDb.NoteRow> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.notebook_id !== undefined) updateData.notebook_id = input.notebook_id;
  if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned;
  if (input.is_archived !== undefined) updateData.is_archived = input.is_archived;

  let data: Note;
  if (Object.keys(updateData).length > 0) {
    data = (await notesDb.updateNote(db, noteId, userId, updateData)) as Note;
  } else {
    data = existingNote;
  }

  if (input.content !== undefined) {
    syncNoteLinks(db, noteId, userId, input.content).catch(() => {
      /* best-effort; don't fail the update */
    });
  }

  // Update tags if provided
  if (input.tag_ids !== undefined) {
    await notesDb.deleteNoteTags(db, noteId);

    if (input.tag_ids.length > 0) {
      const validTagIds = await notesDb.selectUserTagIds(db, userId, input.tag_ids);
      if (validTagIds.length > 0) {
        await notesDb.insertNoteTags(
          db,
          validTagIds.map((tagId) => ({ note_id: noteId, tag_id: tagId })),
        );
      }
    }
  }

  return data;
}

export async function deleteNote(
  db: SupabaseClient,
  noteId: string,
  userId: string,
): Promise<void> {
  const existingNote = await getNoteById(db, noteId, userId);
  if (!existingNote) {
    throw new Error('Note not found or access denied');
  }
  await notesDb.softDeleteNote(db, noteId, userId);
}

export async function restoreNote(
  db: SupabaseClient,
  noteId: string,
  userId: string,
): Promise<Note> {
  // Verify the note belongs to the user (including deleted ones)
  const { data: note, error: fetchError } = await db
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await db
    .from('notes')
    .update({ deleted_at: null })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to restore note: ${error.message}`);
  }

  return data as Note;
}

export async function searchNotes(
  db: SupabaseClient,
  userId: string,
  query: string,
): Promise<Note[]> {
  // Use PostgreSQL full-text search
  const { data, error } = await db
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .textSearch('content_text', query);

  if (error) {
    // Fallback to simple filtering if full-text search fails
    const searchLower = query.toLowerCase();
    const { data: allNotes, error: fetchError } = await db
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .eq('is_archived', false);

    if (fetchError) {
      throw new Error(`Failed to search notes: ${fetchError.message}`);
    }

    return (allNotes || []).filter(
      (note) =>
        note.title.toLowerCase().includes(searchLower) ||
        (note.content_text && note.content_text.toLowerCase().includes(searchLower)),
    ) as Note[];
  }

  return (data || []) as Note[];
}

// ========== Notebooks CRUD ==========

export async function getNotebooksByUserId(
  db: SupabaseClient,
  userId: string,
): Promise<Notebook[]> {
  const { data, error } = await db
    .from('notebooks')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch notebooks: ${error.message}`);
  }

  return (data || []) as Notebook[];
}

export async function getNotebookById(
  db: SupabaseClient,
  notebookId: string,
  userId: string,
): Promise<Notebook | null> {
  const { data, error } = await db
    .from('notebooks')
    .select('*')
    .eq('id', notebookId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch notebook: ${error.message}`);
  }

  return data as Notebook;
}

export async function createNotebook(
  db: SupabaseClient,
  userId: string,
  input: CreateNotebookInput,
): Promise<Notebook> {
  // Verify parent notebook belongs to user if specified
  if (input.parent_id) {
    const parent = await getNotebookById(db, input.parent_id, userId);
    if (!parent) {
      throw new Error('Parent notebook not found or access denied');
    }
  }

  const { data, error } = await db
    .from('notebooks')
    .insert({
      user_id: userId,
      name: input.name,
      parent_id: input.parent_id || null,
      color: input.color || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create notebook: ${error.message}`);
  }

  return data as Notebook;
}

export async function updateNotebook(
  db: SupabaseClient,
  notebookId: string,
  userId: string,
  input: UpdateNotebookInput,
): Promise<Notebook> {
  // Verify the notebook belongs to the user
  const existingNotebook = await getNotebookById(db, notebookId, userId);
  if (!existingNotebook) {
    throw new Error('Notebook not found or access denied');
  }

  // Verify parent notebook belongs to user if specified
  if (input.parent_id !== undefined && input.parent_id !== null) {
    const parent = await getNotebookById(db, input.parent_id, userId);
    if (!parent) {
      throw new Error('Parent notebook not found or access denied');
    }
    // Prevent circular references
    if (input.parent_id === notebookId) {
      throw new Error('Cannot set notebook as its own parent');
    }
  }

  const updateData: Partial<Notebook> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.parent_id !== undefined) updateData.parent_id = input.parent_id;
  if (input.color !== undefined) updateData.color = input.color;

  const { data, error } = await db
    .from('notebooks')
    .update(updateData)
    .eq('id', notebookId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update notebook: ${error.message}`);
  }

  return data as Notebook;
}

export async function deleteNotebook(
  db: SupabaseClient,
  notebookId: string,
  userId: string,
): Promise<void> {
  // Verify the notebook belongs to the user
  const existingNotebook = await getNotebookById(db, notebookId, userId);
  if (!existingNotebook) {
    throw new Error('Notebook not found or access denied');
  }

  // Check if notebook has notes
  const { data: notes, error: notesError } = await db
    .from('notes')
    .select('id')
    .eq('notebook_id', notebookId)
    .is('deleted_at', null)
    .limit(1);

  if (notesError) {
    throw new Error(`Failed to check notebook notes: ${notesError.message}`);
  }

  if (notes && notes.length > 0) {
    throw new Error('Cannot delete notebook that contains notes');
  }

  const { error } = await db
    .from('notebooks')
    .delete()
    .eq('id', notebookId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete notebook: ${error.message}`);
  }
}

// ========== Tags CRUD ==========

export async function getTagsByUserId(db: SupabaseClient, userId: string): Promise<Tag[]> {
  const { data, error } = await db
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  return (data || []) as Tag[];
}

export async function getTagById(
  db: SupabaseClient,
  tagId: string,
  userId: string,
): Promise<Tag | null> {
  const { data, error } = await db
    .from('tags')
    .select('*')
    .eq('id', tagId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch tag: ${error.message}`);
  }

  return data as Tag;
}

export async function createTag(
  db: SupabaseClient,
  userId: string,
  input: CreateTagInput,
): Promise<Tag> {
  const { data, error } = await db
    .from('tags')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      color: input.color || null,
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      throw new Error('Tag with this name already exists');
    }
    throw new Error(`Failed to create tag: ${error.message}`);
  }

  return data as Tag;
}

export async function updateTag(
  db: SupabaseClient,
  tagId: string,
  userId: string,
  input: UpdateTagInput,
): Promise<Tag> {
  // Verify the tag belongs to the user
  const existingTag = await getTagById(db, tagId, userId);
  if (!existingTag) {
    throw new Error('Tag not found or access denied');
  }

  const updateData: Partial<Tag> = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.color !== undefined) updateData.color = input.color;

  const { data, error } = await db
    .from('tags')
    .update(updateData)
    .eq('id', tagId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      throw new Error('Tag with this name already exists');
    }
    throw new Error(`Failed to update tag: ${error.message}`);
  }

  return data as Tag;
}

export async function deleteTag(
  db: SupabaseClient,
  tagId: string,
  userId: string,
): Promise<void> {
  // Verify the tag belongs to the user
  const existingTag = await getTagById(db, tagId, userId);
  if (!existingTag) {
    throw new Error('Tag not found or access denied');
  }

  // Delete will cascade to note_tags due to foreign key constraint
  const { error } = await db.from('tags').delete().eq('id', tagId).eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete tag: ${error.message}`);
  }
}

// ========== Attachments ==========

// ========== Note Versions ==========

export async function getNoteVersions(
  db: SupabaseClient,
  noteId: string,
  userId: string,
): Promise<NoteVersion[]> {
  // Verify note belongs to user
  const note = await getNoteById(db, noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await db
    .from('note_versions')
    .select('*')
    .eq('note_id', noteId)
    .order('version_number', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch note versions: ${error.message}`);
  }

  return (data || []) as NoteVersion[];
}

/** Prefix used in content_text to identify share events in version history (not restorable). */
export const SHARE_HISTORY_PREFIX = 'Shared with ';

/**
 * Add a share event to the note's version history so it appears in Version History.
 * Call after creating a share; does not update the note content.
 */
export async function addShareToNoteHistory(
  db: SupabaseClient,
  noteId: string,
  ownerId: string,
  details: { recipientLabel: string; permission: string; viewLink?: string | null },
): Promise<void> {
  const note = await getNoteById(db, noteId, ownerId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data: maxRow } = await db
    .from('note_versions')
    .select('version_number')
    .eq('note_id', noteId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (maxRow?.version_number ?? 0) + 1;
  const lines = [
    `${SHARE_HISTORY_PREFIX}${details.recipientLabel}`,
    `Permission: ${details.permission}`,
    `At: ${new Date().toISOString()}`,
    ...(details.viewLink ? ['', `View link: ${details.viewLink}`] : []),
  ];
  const contentText = lines.join('\n');
  const content = {
    type: 'doc',
    content: lines.map((text) => ({
      type: 'paragraph',
      content: text ? [{ type: 'text' as const, text }] : [],
    })),
  };

  const { error } = await db.from('note_versions').insert({
    note_id: noteId,
    content,
    content_text: contentText,
    version_number: nextVersion,
  });

  if (error) {
    throw new Error(`Failed to add share to note history: ${error.message}`);
  }
}

export async function getNoteVersion(
  db: SupabaseClient,
  noteId: string,
  versionNumber: number,
  userId: string,
): Promise<NoteVersion | null> {
  // Verify note belongs to user
  const note = await getNoteById(db, noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await db
    .from('note_versions')
    .select('*')
    .eq('note_id', noteId)
    .eq('version_number', versionNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch note version: ${error.message}`);
  }

  return data as NoteVersion;
}

export async function restoreNoteVersion(
  db: SupabaseClient,
  noteId: string,
  versionNumber: number,
  userId: string,
): Promise<Note> {
  // Verify note belongs to user
  const note = await getNoteById(db, noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  // Get the version to restore
  const version = await getNoteVersion(db, noteId, versionNumber, userId);
  if (!version) {
    throw new Error('Version not found');
  }

  // Share events are recorded in history but cannot be restored as note content
  if (version.content_text?.trim().startsWith(SHARE_HISTORY_PREFIX)) {
    throw new Error('Cannot restore a share event; it is not a content version.');
  }

  // Update the note with the version's content
  // This will trigger the versioning trigger, creating a new version with the current content
  const { data, error } = await db
    .from('notes')
    .update({
      content: version.content,
      content_text: version.content_text,
    })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to restore version: ${error.message}`);
  }

  return data as Note;
}

// ========== Note Sharing ==========

export async function shareNoteWithUser(
  db: SupabaseClient,
  noteId: string,
  ownerId: string,
  input: CreateShareInput,
): Promise<SharedNote> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify note belongs to owner
  const note = await getNoteById(db, noteId, ownerId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  // If sharing with a user, resolve email to user ID if needed
  let resolvedUserId: string | null = null;
  if (input.shared_with_user_email) {
    // Look up user by email; if not found, fall back to public share (resolvedUserId stays null)
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to look up user: ${listError.message}`);
    }
    const user = users?.users.find(
      (u) => u.email?.toLowerCase() === input.shared_with_user_email?.toLowerCase(),
    );
    if (user) {
      resolvedUserId = user.id;
    }
    // If user not found: resolvedUserId remains null → insert creates a public share (link); route can email the link
  } else if (input.shared_with_user_id) {
    // Check if it's a UUID or email
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(input.shared_with_user_id)) {
      // It's a UUID, verify user exists
      try {
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(
          input.shared_with_user_id,
        );
        if (userError || !user) {
          throw new Error('User not found');
        }
        resolvedUserId = input.shared_with_user_id;
      } catch (err) {
        throw new Error(
          `Failed to verify user: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }
    } else {
      // It's an email, look it up
      const emailToFind = input.shared_with_user_id;
      if (!emailToFind) {
        throw new Error('Email address is required');
      }
      try {
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          throw new Error(`Failed to look up user: ${listError.message}`);
        }
        const user = users?.users.find((u) => u.email?.toLowerCase() === emailToFind.toLowerCase());
        if (!user) {
          throw new Error(`User with email ${emailToFind} not found`);
        }
        resolvedUserId = user.id;
      } catch (err) {
        if (err instanceof Error && err.message.includes('not found')) {
          throw err;
        }
        throw new Error(
          `Failed to look up user by email: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }
    }
  }

  const shareData: {
    note_id: string;
    owner_id: string;
    shared_with_user_id?: string | null;
    permission: 'view' | 'edit';
    expires_at?: string | null;
  } = {
    note_id: noteId,
    owner_id: ownerId,
    shared_with_user_id: resolvedUserId || null,
    permission: input.permission || 'view',
    expires_at: input.expires_at || null,
  };

  const { data, error } = await db.from('shared_notes').insert(shareData).select().single();

  if (error) {
    // Handle unique constraint violation (already shared with this user)
    if (error.code === '23505') {
      throw new Error('Note is already shared with this user');
    }
    throw new Error(`Failed to share note: ${error.message}`);
  }

  const share = data as SharedNote;

  // Populate shared_with_user (email) so callers can send notification
  if (share.shared_with_user_id) {
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        share.shared_with_user_id,
      );
      if (!userError && userData?.user) {
        share.shared_with_user = {
          id: userData.user.id,
          email: userData.user.email,
          username: userData.user.user_metadata?.username,
        };
      }
    } catch {
      // Continue without user info; share was still created
    }
  }

  return share;
}

export async function getNoteShares(
  db: SupabaseClient,
  noteId: string,
  ownerId: string,
): Promise<SharedNote[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify note belongs to owner
  const note = await getNoteById(db, noteId, ownerId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await db
    .from('shared_notes')
    .select('*')
    .eq('note_id', noteId)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch note shares: ${error.message}`);
  }

  const shares = (data || []) as SharedNote[];

  // Populate user info for shares with specific users
  for (const share of shares) {
    if (share.shared_with_user_id) {
      try {
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(
          share.shared_with_user_id,
        );
        if (!userError && user?.user) {
          share.shared_with_user = {
            id: user.user.id,
            email: user.user.email,
            username: user.user.user_metadata?.username,
          };
        }
        // If user lookup fails, continue without populating user info
      } catch (err) {
        // Silently continue if user lookup fails
        // The share will still be returned, just without user details
      }
    }
  }

  return shares;
}

export async function getSharedNotes(db: SupabaseClient, userId: string): Promise<Note[]> {
  // Get notes shared with this user (not expired)
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('shared_notes')
    .select('note_id')
    .eq('shared_with_user_id', userId)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) {
    throw new Error(`Failed to fetch shared notes: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  const noteIds = data.map((s) => s.note_id);
  const { data: notes, error: notesError } = await db
    .from('notes')
    .select('*')
    .in('id', noteIds)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (notesError) {
    throw new Error(`Failed to fetch shared notes: ${notesError.message}`);
  }

  const notesWithAttachments = (notes || []) as Note[];

  // Fetch attachments for all notes
  if (notesWithAttachments.length > 0) {
    const { data: attachments, error: attachmentsError } = await db
      .from('attachments')
      .select('*')
      .in('note_id', noteIds)
      .order('created_at', { ascending: true });

    if (!attachmentsError && attachments) {
      // Group attachments by note_id
      const attachmentsByNoteId = new Map<string, Attachment[]>();
      for (const attachment of attachments as Attachment[]) {
        if (!attachmentsByNoteId.has(attachment.note_id)) {
          attachmentsByNoteId.set(attachment.note_id, []);
        }
        attachmentsByNoteId.get(attachment.note_id)!.push(attachment);
      }

      // Attach attachments to each note
      for (const note of notesWithAttachments) {
        note.attachments = attachmentsByNoteId.get(note.id) || [];
      }
    }
  }

  return notesWithAttachments;
}

export async function getSharedNotesCount(db: SupabaseClient, userId: string): Promise<number> {
  // Get notes shared with this user (not expired)
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('shared_notes')
    .select('note_id')
    .eq('shared_with_user_id', userId)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) {
    throw new Error(`Failed to fetch shared notes count: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return 0;
  }

  // Filter out deleted notes to match what getSharedNotes returns
  const noteIds = data.map((s) => s.note_id);
  const { count, error: notesError } = await db
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .in('id', noteIds)
    .is('deleted_at', null);

  if (notesError) {
    throw new Error(`Failed to fetch shared notes count: ${notesError.message}`);
  }

  return count ?? 0;
}

export async function getSharedNoteByToken(token: string): Promise<Note | null> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data: share, error: shareError } = await supabase
    .from('shared_notes')
    .select('note_id, expires_at')
    .eq('share_token', token)
    .single();

  if (shareError || !share) {
    return null;
  }

  // Check if expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return null;
  }

  // Get the note
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', share.note_id)
    .is('deleted_at', null)
    .single();

  if (noteError || !note) {
    return null;
  }

  const noteWithAttachments = note as Note;

  // Fetch attachments for this note
  const { data: attachments, error: attachmentsError } = await supabase
    .from('attachments')
    .select('*')
    .eq('note_id', share.note_id)
    .order('created_at', { ascending: true });

  if (!attachmentsError && attachments) {
    noteWithAttachments.attachments = attachments as Attachment[];
  }

  return noteWithAttachments;
}

export async function updateSharePermission(
  db: SupabaseClient,
  shareId: string,
  ownerId: string,
  permission: 'view' | 'edit',
): Promise<SharedNote> {
  // Verify share belongs to owner
  const { data: share, error: shareError } = await db
    .from('shared_notes')
    .select('owner_id')
    .eq('id', shareId)
    .single();

  if (shareError || !share || share.owner_id !== ownerId) {
    throw new Error('Share not found or access denied');
  }

  const { data, error } = await db
    .from('shared_notes')
    .update({ permission })
    .eq('id', shareId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update share permission: ${error.message}`);
  }

  return data as SharedNote;
}

export async function unshareNote(
  db: SupabaseClient,
  shareId: string,
  ownerId: string,
): Promise<void> {
  // Verify share belongs to owner
  const { data: share, error: shareError } = await db
    .from('shared_notes')
    .select('owner_id')
    .eq('id', shareId)
    .single();

  if (shareError || !share || share.owner_id !== ownerId) {
    throw new Error('Share not found or access denied');
  }

  const { error } = await db.from('shared_notes').delete().eq('id', shareId);

  if (error) {
    throw new Error(`Failed to unshare note: ${error.message}`);
  }
}

// ========== Attachments ==========

export async function getAttachmentsByNoteId(
  db: SupabaseClient,
  noteId: string,
  userId: string,
): Promise<Attachment[]> {
  // Verify the note belongs to the user
  const note = await getNoteById(db, noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await db
    .from('attachments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch attachments: ${error.message}`);
  }

  return (data || []) as Attachment[];
}

export async function createAttachment(
  db: SupabaseClient,
  noteId: string,
  userId: string,
  fileData: {
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    mime_type?: string;
  },
): Promise<Attachment> {
  // Verify the note belongs to the user
  const note = await getNoteById(db, noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await db
    .from('attachments')
    .insert({
      note_id: noteId,
      file_name: fileData.file_name,
      file_path: fileData.file_path,
      file_type: fileData.file_type,
      file_size: fileData.file_size,
      mime_type: fileData.mime_type || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create attachment: ${error.message}`);
  }

  return data as Attachment;
}

export async function deleteAttachment(
  db: SupabaseClient,
  attachmentId: string,
  userId: string,
): Promise<void> {
  // Get attachment to verify it belongs to a note owned by the user and get file path
  const { data: attachment, error: fetchError } = await db
    .from('attachments')
    .select('note_id, file_path')
    .eq('id', attachmentId)
    .single();

  if (fetchError || !attachment) {
    throw new Error('Attachment not found');
  }

  const note = await getNoteById(db, attachment.note_id, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  // Delete file from storage
  const { error: storageError } = await db.storage
    .from('note-attachments')
    .remove([attachment.file_path]);

  if (storageError) {
    // Log but don't fail if storage deletion fails (file might already be deleted)
    console.warn(`Failed to delete file from storage: ${storageError.message}`);
  }

  // Delete attachment record
  const { error } = await db.from('attachments').delete().eq('id', attachmentId);

  if (error) {
    throw new Error(`Failed to delete attachment: ${error.message}`);
  }
}

// ========== Saved Searches ==========

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: string;
  created_at: string;
}

export async function getSavedSearches(
  db: SupabaseClient,
  userId: string,
): Promise<SavedSearch[]> {
  const { data, error } = await db
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch saved searches: ${error.message}`);
  }

  return (data || []) as SavedSearch[];
}

export async function createSavedSearch(
  db: SupabaseClient,
  userId: string,
  input: { name: string; query: string },
): Promise<SavedSearch> {

  const { data, error } = await db
    .from('saved_searches')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      query: input.query.trim(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create saved search: ${error.message}`);
  }

  return data as SavedSearch;
}

export async function deleteSavedSearch(
  db: SupabaseClient,
  savedSearchId: string,
  userId: string,
): Promise<void> {
  const { error } = await db
    .from('saved_searches')
    .delete()
    .eq('id', savedSearchId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete saved search: ${error.message}`);
  }
}

// ========== Note Links (Backlinks) ==========

export async function syncNoteLinks(
  db: SupabaseClient,
  sourceNoteId: string,
  userId: string,
  content: Record<string, unknown>,
): Promise<void> {
  const note = await getNoteById(db, sourceNoteId, userId);
  if (!note) return;

  const targetIds = extractNoteIdsFromContent(content);
  const validTargetIds: string[] = [];

  for (const targetId of targetIds) {
    if (targetId === sourceNoteId) continue;
    const target = await getNoteById(db, targetId, userId);
    if (target) validTargetIds.push(targetId);
  }

  await db.from('note_links').delete().eq('source_note_id', sourceNoteId);

  if (validTargetIds.length > 0) {
    const rows = validTargetIds.map((target_note_id) => ({
      source_note_id: sourceNoteId,
      target_note_id,
    }));
    await db.from('note_links').upsert(rows, {
      onConflict: 'source_note_id,target_note_id',
    });
  }
}

export async function getBacklinks(
  db: SupabaseClient,
  noteId: string,
  userId: string,
): Promise<Note[]> {
  const note = await getNoteById(db, noteId, userId);
  if (!note) return [];

  const { data: links, error } = await db
    .from('note_links')
    .select('source_note_id')
    .eq('target_note_id', noteId);

  if (error || !links || links.length === 0) return [];

  const sourceIds = [...new Set(links.map((l) => l.source_note_id))];
  const notes: Note[] = [];

  for (const id of sourceIds) {
    const n = await getNoteById(db, id, userId);
    if (n) notes.push(n);
  }

  notes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return notes;
}

// ========== Note Templates ==========

export interface NoteTemplate {
  id: string;
  user_id: string;
  name: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function getNoteTemplates(
  db: SupabaseClient,
  userId: string,
): Promise<NoteTemplate[]> {
  const { data, error } = await db
    .from('note_templates')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return (data || []) as NoteTemplate[];
}

export async function createNoteTemplate(
  db: SupabaseClient,
  userId: string,
  input: { name: string; content: Record<string, unknown> },
): Promise<NoteTemplate> {
  const content =
    input.content && typeof input.content === 'object' && input.content.type === 'doc'
      ? input.content
      : { type: 'doc' as const, content: [] };

  const { data, error } = await db
    .from('note_templates')
    .insert({
      user_id: userId,
      name: input.name.trim().slice(0, 255),
      content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`);
  }

  return data as NoteTemplate;
}

export async function deleteNoteTemplate(
  db: SupabaseClient,
  templateId: string,
  userId: string,
): Promise<void> {
  const { error } = await db
    .from('note_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`);
  }
}
