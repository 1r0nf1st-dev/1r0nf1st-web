-- Enable Row Level Security on all notes-related tables
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;

-- Policies for notebooks: Users can only access their own notebooks
CREATE POLICY "Users can view their own notebooks" ON notebooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notebooks" ON notebooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebooks" ON notebooks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebooks" ON notebooks
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for tags: Users can only access their own tags
CREATE POLICY "Users can view their own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for notes: Users can only access their own notes
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for note_tags: Users can only access note_tags for their own notes
CREATE POLICY "Users can view note_tags for their own notes" ON note_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert note_tags for their own notes" ON note_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete note_tags for their own notes" ON note_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
    )
  );

-- Policies for attachments: Users can only access attachments for their own notes
CREATE POLICY "Users can view attachments for their own notes" ON attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = attachments.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments for their own notes" ON attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = attachments.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments for their own notes" ON attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = attachments.note_id AND notes.user_id = auth.uid()
    )
  );

-- Policies for note_versions: Users can only access versions for their own notes
CREATE POLICY "Users can view note_versions for their own notes" ON note_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_versions.note_id AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert note_versions for their own notes" ON note_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes WHERE notes.id = note_versions.note_id AND notes.user_id = auth.uid()
    )
  );
