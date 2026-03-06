-- note_links: tracks bi-directional links between notes for backlinks
CREATE TABLE IF NOT EXISTS note_links (
  source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  PRIMARY KEY (source_note_id, target_note_id),
  CONSTRAINT note_links_no_self CHECK (source_note_id != target_note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);

ALTER TABLE note_links DISABLE ROW LEVEL SECURITY;

-- note_templates: reusable note structures
CREATE TABLE IF NOT EXISTS note_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_note_templates_user ON note_templates(user_id);

ALTER TABLE note_templates DISABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_note_templates_updated_at
  BEFORE UPDATE ON note_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
