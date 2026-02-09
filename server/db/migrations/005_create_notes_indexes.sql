-- Indexes for notebooks
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_parent_id ON notebooks(parent_id);

-- Indexes for tags
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- Indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_notebook_id ON notes(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived) WHERE is_archived = FALSE;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_notes_user_notebook ON notes(user_id, notebook_id) WHERE deleted_at IS NULL;

-- Indexes for note_tags junction table
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

-- Indexes for attachments
CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON attachments(note_id);

-- Indexes for note_versions
CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_version_number ON note_versions(note_id, version_number DESC);

-- Full-text search index on content_text (using GIN index for PostgreSQL full-text search)
CREATE INDEX IF NOT EXISTS idx_notes_content_text_search ON notes USING gin(to_tsvector('english', COALESCE(content_text, '')));
