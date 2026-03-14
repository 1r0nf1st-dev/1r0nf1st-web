-- Reset script: Drops all app tables, triggers, policies, and functions.
-- Usage: psql $DATABASE_URL -f scripts/db-reset.sql
-- Purpose: Clean slate for testing or recreating schema.

-- Drop functions that reference table types (before dropping tables)
DROP FUNCTION IF EXISTS is_share_expired(shared_notes);

-- Drop tables in dependency order (children before parents)
DROP TABLE IF EXISTS note_links CASCADE;
DROP TABLE IF EXISTS note_templates CASCADE;
DROP TABLE IF EXISTS note_tags CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS note_versions CASCADE;
DROP TABLE IF EXISTS shared_notes CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS notebooks CASCADE;
DROP TABLE IF EXISTS goal_milestones CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS web_clipper_tokens CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Public schema Second Brain tables
DROP TABLE IF EXISTS public.sb_thoughts CASCADE;
DROP TABLE IF EXISTS public.sb_projects CASCADE;
DROP TABLE IF EXISTS public.sb_people CASCADE;
DROP TABLE IF EXISTS public.sb_ideas CASCADE;
DROP TABLE IF EXISTS public.sb_admin CASCADE;
DROP TABLE IF EXISTS public.sb_resources CASCADE;

-- Drop second_brain schema (legacy; may contain thoughts, projects, etc.)
DROP SCHEMA IF EXISTS second_brain CASCADE;

-- Drop storage policies on note-attachments bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role uploads to note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role reads from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role deletes from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role updates in note-attachments" ON storage.objects;

-- Drop app functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS extract_text_from_content(JSONB);
DROP FUNCTION IF EXISTS update_note_content_text();
DROP FUNCTION IF EXISTS create_note_version();
DROP FUNCTION IF EXISTS cleanup_old_versions();
