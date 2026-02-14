import { supabase } from '../db/supabase.js';

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

// ========== Notes CRUD ==========

export async function getNotesByUserId(
  userId: string,
  filters?: NotesFilters,
): Promise<Note[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);

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
    const { data: noteTags, error: tagError } = await supabase
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
    const { data: noteTags, error: tagsError } = await supabase
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
        const { data: tags, error: fetchTagsError } = await supabase
          .from('tags')
          .select('*')
          .in('id', allTagIds)
          .eq('user_id', userId);

        if (!fetchTagsError && tags) {
          const tagsMap = new Map(tags.map((t) => [t.id, t]));
          // Attach tags to each note
          for (const note of notes) {
            const tagIds = tagsByNoteId.get(note.id) || [];
            note.tags = tagIds.map((tid) => tagsMap.get(tid)).filter((t): t is Tag => t !== undefined);
          }
        }
      }
    }
  }

  return notes;
}

export async function getNoteById(noteId: string, userId: string): Promise<Note | null> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch note: ${error.message}`);
  }

  const note = data as Note;

  // Fetch tags for this note
  const { data: noteTags, error: tagsError } = await supabase
    .from('note_tags')
    .select('tag_id')
    .eq('note_id', noteId);

  if (!tagsError && noteTags && noteTags.length > 0) {
    const tagIds = noteTags.map((nt) => nt.tag_id);
    const { data: tags, error: fetchTagsError } = await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds);

    if (!fetchTagsError && tags) {
      note.tags = tags as Tag[];
    }
  }

  // Fetch attachments for this note
  const { data: attachments, error: attachmentsError } = await supabase
    .from('attachments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true });

  if (!attachmentsError && attachments) {
    note.attachments = attachments as Attachment[];
  }

  return note;
}

export async function createNote(userId: string, input: CreateNoteInput): Promise<Note> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: input.title || '',
      content: input.content || {},
      notebook_id: input.notebook_id || null,
      is_pinned: false,
      is_archived: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create note: ${error.message}`);
  }

  const note = data as Note;

  // Link tags if provided
  if (input.tag_ids && input.tag_ids.length > 0) {
    // Verify all tags belong to the user
    const { data: userTags, error: tagsError } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', userId)
      .in('id', input.tag_ids);

    if (tagsError) {
      throw new Error(`Failed to verify tags: ${tagsError.message}`);
    }

    const validTagIds = (userTags || []).map((t) => t.id);
    if (validTagIds.length > 0) {
      const noteTagInserts = validTagIds.map((tagId) => ({
        note_id: note.id,
        tag_id: tagId,
      }));

      const { error: linkError } = await supabase.from('note_tags').insert(noteTagInserts);

      if (linkError) {
        throw new Error(`Failed to link tags: ${linkError.message}`);
      }
    }
  }

  return note;
}

export async function updateNote(
  noteId: string,
  userId: string,
  input: UpdateNoteInput,
): Promise<Note> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the note belongs to the user
  const existingNote = await getNoteById(noteId, userId);
  if (!existingNote) {
    throw new Error('Note not found or access denied');
  }

  const updateData: Partial<Note> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.notebook_id !== undefined) updateData.notebook_id = input.notebook_id;
  if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned;
  if (input.is_archived !== undefined) updateData.is_archived = input.is_archived;

  const { data, error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update note: ${error.message}`);
  }

  // Update tags if provided
  if (input.tag_ids !== undefined) {
    // Delete existing tag links
    const { error: deleteError } = await supabase.from('note_tags').delete().eq('note_id', noteId);

    if (deleteError) {
      throw new Error(`Failed to remove existing tags: ${deleteError.message}`);
    }

    // Add new tag links
    if (input.tag_ids.length > 0) {
      // Verify all tags belong to the user
      const { data: userTags, error: tagsError } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .in('id', input.tag_ids);

      if (tagsError) {
        throw new Error(`Failed to verify tags: ${tagsError.message}`);
      }

      const validTagIds = (userTags || []).map((t) => t.id);
      if (validTagIds.length > 0) {
        const noteTagInserts = validTagIds.map((tagId) => ({
          note_id: noteId,
          tag_id: tagId,
        }));

        const { error: linkError } = await supabase.from('note_tags').insert(noteTagInserts);

        if (linkError) {
          throw new Error(`Failed to link tags: ${linkError.message}`);
        }
      }
    }
  }

  return data as Note;
}

export async function deleteNote(noteId: string, userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the note belongs to the user
  const existingNote = await getNoteById(noteId, userId);
  if (!existingNote) {
    throw new Error('Note not found or access denied');
  }

  // Soft delete: set deleted_at
  const { error } = await supabase
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}

export async function restoreNote(noteId: string, userId: string): Promise<Note> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the note belongs to the user (including deleted ones)
  const { data: note, error: fetchError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await supabase
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

export async function searchNotes(userId: string, query: string): Promise<Note[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Use PostgreSQL full-text search
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .textSearch('content_text', query);

  if (error) {
    // Fallback to simple filtering if full-text search fails
    const searchLower = query.toLowerCase();
    const { data: allNotes, error: fetchError } = await supabase
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

export async function getNotebooksByUserId(userId: string): Promise<Notebook[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
    .from('notebooks')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch notebooks: ${error.message}`);
  }

  return (data || []) as Notebook[];
}

export async function getNotebookById(notebookId: string, userId: string): Promise<Notebook | null> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
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

export async function createNotebook(userId: string, input: CreateNotebookInput): Promise<Notebook> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify parent notebook belongs to user if specified
  if (input.parent_id) {
    const parent = await getNotebookById(input.parent_id, userId);
    if (!parent) {
      throw new Error('Parent notebook not found or access denied');
    }
  }

  const { data, error } = await supabase
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
  notebookId: string,
  userId: string,
  input: UpdateNotebookInput,
): Promise<Notebook> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the notebook belongs to the user
  const existingNotebook = await getNotebookById(notebookId, userId);
  if (!existingNotebook) {
    throw new Error('Notebook not found or access denied');
  }

  // Verify parent notebook belongs to user if specified
  if (input.parent_id !== undefined && input.parent_id !== null) {
    const parent = await getNotebookById(input.parent_id, userId);
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

  const { data, error } = await supabase
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

export async function deleteNotebook(notebookId: string, userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the notebook belongs to the user
  const existingNotebook = await getNotebookById(notebookId, userId);
  if (!existingNotebook) {
    throw new Error('Notebook not found or access denied');
  }

  // Check if notebook has notes
  const { data: notes, error: notesError } = await supabase
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

  const { error } = await supabase.from('notebooks').delete().eq('id', notebookId).eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete notebook: ${error.message}`);
  }
}

// ========== Tags CRUD ==========

export async function getTagsByUserId(userId: string): Promise<Tag[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  return (data || []) as Tag[];
}

export async function getTagById(tagId: string, userId: string): Promise<Tag | null> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
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

export async function createTag(userId: string, input: CreateTagInput): Promise<Tag> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
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

export async function updateTag(tagId: string, userId: string, input: UpdateTagInput): Promise<Tag> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the tag belongs to the user
  const existingTag = await getTagById(tagId, userId);
  if (!existingTag) {
    throw new Error('Tag not found or access denied');
  }

  const updateData: Partial<Tag> = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.color !== undefined) updateData.color = input.color;

  const { data, error } = await supabase
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

export async function deleteTag(tagId: string, userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the tag belongs to the user
  const existingTag = await getTagById(tagId, userId);
  if (!existingTag) {
    throw new Error('Tag not found or access denied');
  }

  // Delete will cascade to note_tags due to foreign key constraint
  const { error } = await supabase.from('tags').delete().eq('id', tagId).eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete tag: ${error.message}`);
  }
}

// ========== Attachments ==========

// ========== Note Versions ==========

export async function getNoteVersions(noteId: string, userId: string): Promise<NoteVersion[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify note belongs to user
  const note = await getNoteById(noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await supabase
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
  noteId: string,
  ownerId: string,
  details: { recipientLabel: string; permission: string; viewLink?: string | null },
): Promise<void> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const note = await getNoteById(noteId, ownerId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data: maxRow } = await supabase
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

  const { error } = await supabase.from('note_versions').insert({
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
  noteId: string,
  versionNumber: number,
  userId: string,
): Promise<NoteVersion | null> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify note belongs to user
  const note = await getNoteById(noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await supabase
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
  noteId: string,
  versionNumber: number,
  userId: string,
): Promise<Note> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify note belongs to user
  const note = await getNoteById(noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  // Get the version to restore
  const version = await getNoteVersion(noteId, versionNumber, userId);
  if (!version) {
    throw new Error('Version not found');
  }

  // Share events are recorded in history but cannot be restored as note content
  if (version.content_text?.trim().startsWith(SHARE_HISTORY_PREFIX)) {
    throw new Error('Cannot restore a share event; it is not a content version.');
  }

  // Update the note with the version's content
  // This will trigger the versioning trigger, creating a new version with the current content
  const { data, error } = await supabase
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
  noteId: string,
  ownerId: string,
  input: CreateShareInput,
): Promise<SharedNote> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify note belongs to owner
  const note = await getNoteById(noteId, ownerId);
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
    const user = users?.users.find((u) => u.email?.toLowerCase() === input.shared_with_user_email?.toLowerCase());
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
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(input.shared_with_user_id);
        if (userError || !user) {
          throw new Error('User not found');
        }
        resolvedUserId = input.shared_with_user_id;
      } catch (err) {
        throw new Error(`Failed to verify user: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        throw new Error(`Failed to look up user by email: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  const { data, error } = await supabase
    .from('shared_notes')
    .insert(shareData)
    .select()
    .single();

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

export async function getNoteShares(noteId: string, ownerId: string): Promise<SharedNote[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify note belongs to owner
  const note = await getNoteById(noteId, ownerId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await supabase
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
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(share.shared_with_user_id);
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

export async function getSharedNotes(userId: string): Promise<Note[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Get notes shared with this user (not expired)
  const now = new Date().toISOString();
  const { data, error } = await supabase
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
  const { data: notes, error: notesError } = await supabase
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
    const { data: attachments, error: attachmentsError } = await supabase
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
  shareId: string,
  ownerId: string,
  permission: 'view' | 'edit',
): Promise<SharedNote> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify share belongs to owner
  const { data: share, error: shareError } = await supabase
    .from('shared_notes')
    .select('owner_id')
    .eq('id', shareId)
    .single();

  if (shareError || !share || share.owner_id !== ownerId) {
    throw new Error('Share not found or access denied');
  }

  const { data, error } = await supabase
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

export async function unshareNote(shareId: string, ownerId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify share belongs to owner
  const { data: share, error: shareError } = await supabase
    .from('shared_notes')
    .select('owner_id')
    .eq('id', shareId)
    .single();

  if (shareError || !share || share.owner_id !== ownerId) {
    throw new Error('Share not found or access denied');
  }

  const { error } = await supabase.from('shared_notes').delete().eq('id', shareId);

  if (error) {
    throw new Error(`Failed to unshare note: ${error.message}`);
  }
}

// ========== Attachments ==========

export async function getAttachmentsByNoteId(noteId: string, userId: string): Promise<Attachment[]> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the note belongs to the user
  const note = await getNoteById(noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await supabase
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
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Verify the note belongs to the user
  const note = await getNoteById(noteId, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  const { data, error } = await supabase
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

export async function deleteAttachment(attachmentId: string, userId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Get attachment to verify it belongs to a note owned by the user and get file path
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('note_id, file_path')
    .eq('id', attachmentId)
    .single();

  if (fetchError || !attachment) {
    throw new Error('Attachment not found');
  }

  const note = await getNoteById(attachment.note_id, userId);
  if (!note) {
    throw new Error('Note not found or access denied');
  }

  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from('note-attachments')
    .remove([attachment.file_path]);

  if (storageError) {
    // Log but don't fail if storage deletion fails (file might already be deleted)
    console.warn(`Failed to delete file from storage: ${storageError.message}`);
  }

  // Delete attachment record
  const { error } = await supabase.from('attachments').delete().eq('id', attachmentId);

  if (error) {
    throw new Error(`Failed to delete attachment: ${error.message}`);
  }
}
