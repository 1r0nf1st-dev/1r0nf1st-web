-- Disable Row Level Security on notes-related tables
-- We handle authentication and authorization in the application layer
-- The service role key is used server-side, so RLS is not needed

ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notebooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions DISABLE ROW LEVEL SECURITY;
