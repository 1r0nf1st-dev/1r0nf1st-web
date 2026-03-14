-- Bootstrap script: Creates all app tables with RLS enabled from the start.
-- Usage: psql $DATABASE_URL -f scripts/db-bootstrap.sql
-- Purpose: Fresh DB with correct schema and RLS in one run.
-- Prerequisite: Run after db-reset.sql, or on a new database. Requires auth.users.

CREATE EXTENSION IF NOT EXISTS vector;

-- PostgREST schema cache: use only public (sb_* tables live here; second_brain schema is dropped by reset)
ALTER ROLE authenticator SET pgrst.db_schemas = 'public';

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);

CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON goal_milestones(goal_id);

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goal_milestones_updated_at BEFORE UPDATE ON goal_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notes tables
CREATE TABLE IF NOT EXISTS notebooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES notebooks(id) ON DELETE CASCADE,
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}',
  content_text TEXT,
  notebook_id UUID REFERENCES notebooks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS note_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  content_text TEXT,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_notebooks_parent_id ON notebooks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_notebook_id ON notes(notebook_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived) WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_notes_user_notebook ON notes(user_id, notebook_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX IF NOT EXISTS idx_note_versions_version_number ON note_versions(note_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_notes_content_text_search ON notes USING gin(to_tsvector('english', COALESCE(content_text, '')));

-- Triggers for notes
CREATE OR REPLACE FUNCTION extract_text_from_content(content JSONB)
RETURNS TEXT AS $$
DECLARE result TEXT := ''; elem JSONB; text_elem JSONB; text_content TEXT;
BEGIN
  IF content ? 'content' AND jsonb_typeof(content->'content') = 'array' THEN
    FOR elem IN SELECT * FROM jsonb_array_elements(content->'content') LOOP
      IF elem->>'type' IN ('paragraph', 'heading', 'bulletList', 'orderedList') THEN
        IF elem ? 'content' AND jsonb_typeof(elem->'content') = 'array' THEN
          FOR text_elem IN SELECT * FROM jsonb_array_elements(elem->'content') LOOP
            IF text_elem->>'type' = 'text' AND text_elem ? 'text' THEN
              text_content := text_elem->>'text';
              IF text_content IS NOT NULL AND text_content != '' THEN result := result || ' ' || text_content; END IF;
            END IF;
          END LOOP;
        END IF;
      ELSIF elem->>'type' = 'text' AND elem ? 'text' THEN
        text_content := elem->>'text';
        IF text_content IS NOT NULL AND text_content != '' THEN result := result || ' ' || text_content; END IF;
      END IF;
    END LOOP;
  END IF;
  RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_note_content_text() RETURNS TRIGGER AS $$
BEGIN NEW.content_text = extract_text_from_content(NEW.content); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notebooks_updated_at BEFORE UPDATE ON notebooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_note_content_text_trigger BEFORE INSERT OR UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_note_content_text();

-- RLS on notes tables
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notebooks" ON notebooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notebooks" ON notebooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notebooks" ON notebooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notebooks" ON notebooks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view note_tags for their own notes" ON note_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert note_tags for their own notes" ON note_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can delete note_tags for their own notes" ON note_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can view attachments for their own notes" ON attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = attachments.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert attachments for their own notes" ON attachments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = attachments.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can delete attachments for their own notes" ON attachments FOR DELETE USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = attachments.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can view note_versions for their own notes" ON note_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_versions.note_id AND notes.user_id = auth.uid()));
CREATE POLICY "Users can insert note_versions for their own notes" ON note_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM notes WHERE notes.id = note_versions.note_id AND notes.user_id = auth.uid()));

-- Goals RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own goal milestones" ON goal_milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can insert their own goal milestones" ON goal_milestones FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can update their own goal milestones" ON goal_milestones FOR UPDATE USING (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "Users can delete their own goal milestones" ON goal_milestones FOR DELETE USING (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = auth.uid()));

-- Shared notes
CREATE TABLE IF NOT EXISTS shared_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  permission VARCHAR(20) NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(note_id, shared_with_user_id)
);
CREATE INDEX IF NOT EXISTS idx_shared_notes_note_id ON shared_notes(note_id);
CREATE INDEX IF NOT EXISTS idx_shared_notes_owner_id ON shared_notes(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_notes_shared_with_user_id ON shared_notes(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_notes_share_token ON shared_notes(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_notes_expires_at ON shared_notes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shared_notes_user_active ON shared_notes(shared_with_user_id) WHERE expires_at IS NULL;

CREATE TRIGGER update_shared_notes_updated_at BEFORE UPDATE ON shared_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION is_share_expired(share_record shared_notes)
RETURNS BOOLEAN AS $$ BEGIN RETURN share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW(); END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view their shares" ON shared_notes FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert shares" ON shared_notes FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their shares" ON shared_notes FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their shares" ON shared_notes FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Recipients can view shares with them" ON shared_notes FOR SELECT USING (auth.uid() = shared_with_user_id);

-- Versioning triggers
CREATE OR REPLACE FUNCTION create_note_version() RETURNS TRIGGER AS $$
DECLARE next_version INTEGER;
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version FROM note_versions WHERE note_id = NEW.id;
    INSERT INTO note_versions (note_id, content, content_text, version_number)
    VALUES (NEW.id, OLD.content, extract_text_from_content(OLD.content), next_version);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_versions() RETURNS TRIGGER AS $$
DECLARE max_version INTEGER; cutoff_version INTEGER;
BEGIN
  SELECT MAX(version_number) INTO max_version FROM note_versions WHERE note_id = NEW.note_id;
  cutoff_version := max_version - 50;
  IF cutoff_version > 0 THEN
    DELETE FROM note_versions WHERE note_id = NEW.note_id AND version_number < cutoff_version;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_note_version_trigger AFTER UPDATE ON notes FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content) EXECUTE FUNCTION create_note_version();
CREATE TRIGGER cleanup_old_versions_trigger AFTER INSERT ON note_versions FOR EACH ROW EXECUTE FUNCTION cleanup_old_versions();

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved searches" ON saved_searches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Web clipper tokens
CREATE TABLE IF NOT EXISTS web_clipper_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_web_clipper_tokens_user_id ON web_clipper_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_web_clipper_tokens_token_hash ON web_clipper_tokens(token_hash);
ALTER TABLE web_clipper_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own web clipper tokens" ON web_clipper_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Note links and templates
CREATE TABLE IF NOT EXISTS note_links (
  source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  PRIMARY KEY (source_note_id, target_note_id),
  CONSTRAINT note_links_no_self CHECK (source_note_id != target_note_id)
);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);
ALTER TABLE note_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage note_links for their notes" ON note_links FOR ALL USING (
  EXISTS (SELECT 1 FROM notes n WHERE n.id = note_links.source_note_id AND n.user_id = auth.uid())) WITH CHECK (
  EXISTS (SELECT 1 FROM notes n WHERE n.id = note_links.source_note_id AND n.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS note_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_note_templates_user ON note_templates(user_id);
CREATE TRIGGER update_note_templates_updated_at BEFORE UPDATE ON note_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own note templates" ON note_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage policies (011 + 012)
DROP POLICY IF EXISTS "Allow authenticated uploads to note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from note-attachments" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to note-attachments"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'note-attachments');
CREATE POLICY "Allow authenticated reads from note-attachments"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'note-attachments');
CREATE POLICY "Allow authenticated deletes from note-attachments"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'note-attachments');

DROP POLICY IF EXISTS "Allow service_role uploads to note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role reads from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role deletes from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role updates in note-attachments" ON storage.objects;
CREATE POLICY "Allow service_role uploads to note-attachments" ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'note-attachments');
CREATE POLICY "Allow service_role reads from note-attachments" ON storage.objects FOR SELECT TO service_role USING (bucket_id = 'note-attachments');
CREATE POLICY "Allow service_role deletes from note-attachments" ON storage.objects FOR DELETE TO service_role USING (bucket_id = 'note-attachments');
CREATE POLICY "Allow service_role updates in note-attachments" ON storage.objects FOR UPDATE TO service_role USING (bucket_id = 'note-attachments') WITH CHECK (bucket_id = 'note-attachments');

-- Second Brain (public.sb_*)
CREATE TABLE IF NOT EXISTS public.sb_thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text TEXT NOT NULL,
  source TEXT, category TEXT, confidence INT, routed BOOLEAN DEFAULT FALSE,
  embedding vector(768), created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sb_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, goal TEXT, next_action TEXT, status TEXT DEFAULT 'active',
  due_date DATE, area TEXT, notes TEXT, embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sb_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, relationship TEXT, last_interaction DATE, follow_up_date DATE,
  notes TEXT, embedding vector(768), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sb_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, body TEXT, area TEXT, status TEXT DEFAULT 'raw',
  embedding vector(768), created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sb_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task TEXT NOT NULL, due_date DATE, status TEXT DEFAULT 'pending',
  notes TEXT, embedding vector(768), created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.sb_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, url TEXT, summary TEXT, tags TEXT[],
  embedding vector(768), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.sb_search_all(
  query_embedding vector(768), match_threshold float DEFAULT 0.70, match_count int DEFAULT 5
)
RETURNS TABLE (table_name text, record_id uuid, label text, detail text, similarity float, created_at timestamptz)
LANGUAGE sql STABLE AS $$
  SELECT 'projects'::text, id, name, notes, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_projects WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  UNION ALL SELECT 'people'::text, id, name, notes, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_people WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  UNION ALL SELECT 'ideas'::text, id, title, body, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_ideas WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  UNION ALL SELECT 'admin'::text, id, task, notes, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_admin WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  UNION ALL SELECT 'resources'::text, id, title, summary, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_resources WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC LIMIT match_count;
$$;

CREATE INDEX IF NOT EXISTS idx_sb_projects_emb ON public.sb_projects USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_sb_people_emb ON public.sb_people USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_sb_ideas_emb ON public.sb_ideas USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_sb_admin_emb ON public.sb_admin USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_sb_resources_emb ON public.sb_resources USING hnsw (embedding vector_cosine_ops);

DROP TRIGGER IF EXISTS update_sb_projects_updated_at ON public.sb_projects;
CREATE TRIGGER update_sb_projects_updated_at BEFORE UPDATE ON public.sb_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_sb_people_updated_at ON public.sb_people;
CREATE TRIGGER update_sb_people_updated_at BEFORE UPDATE ON public.sb_people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.sb_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sb_resources ENABLE ROW LEVEL SECURITY;
