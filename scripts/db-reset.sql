-- Reset script: Drops all app tables, triggers, policies, and functions.
-- Usage: psql $DATABASE_URL -f scripts/db-reset.sql
-- Purpose: Clean slate for testing or recreating schema.
-- Next step: scripts/db-bootstrap.sql (or pnpm db:reset-bootstrap from repo root).

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

-- OpenBrain (ob_*) tables and objects — drop before sb_* so ob_search_all_brain can be dropped
DROP TABLE IF EXISTS public.ob_node_attachments CASCADE;
DROP TABLE IF EXISTS public.ob_reactions CASCADE;
DROP TABLE IF EXISTS public.ob_edges CASCADE;
DROP TABLE IF EXISTS public.ob_node_collections CASCADE;
DROP TABLE IF EXISTS public.ob_collections CASCADE;
DROP TABLE IF EXISTS public.ob_ai_sessions CASCADE;
DROP TABLE IF EXISTS public.ob_nodes CASCADE;
DROP TABLE IF EXISTS public.ob_profiles CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created_ob ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_ob_user() CASCADE;
-- Vector search helpers (signatures must match db-bootstrap.sql)
DROP FUNCTION IF EXISTS public.sb_search_all(vector, double precision, integer);
DROP FUNCTION IF EXISTS public.ob_search_nodes(vector, double precision, integer, uuid, ob_node_type);
-- Legacy 4-arg overloads (pre–viewer_id); then current 5-arg signature
DROP FUNCTION IF EXISTS public.ob_search_all_brain(vector, uuid, double precision, integer);
DROP FUNCTION IF EXISTS public.ob_search_all_brain(vector, uuid, real, integer);
DROP FUNCTION IF EXISTS public.ob_search_all_brain(vector, uuid, double precision, integer, uuid);

DROP TYPE IF EXISTS public.ob_reaction_type CASCADE;
DROP TYPE IF EXISTS public.ob_session_type CASCADE;
DROP TYPE IF EXISTS public.ob_edge_creator CASCADE;
DROP TYPE IF EXISTS public.ob_edge_type CASCADE;
DROP TYPE IF EXISTS public.ob_visibility CASCADE;
DROP TYPE IF EXISTS public.ob_node_type CASCADE;

-- Public schema Second Brain tables
DROP TABLE IF EXISTS public.sb_thought_attachments CASCADE;
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

-- Application logging (drop RPCs before tables)
DROP FUNCTION IF EXISTS public.app_log_interactions_by_path(timestamptz, timestamptz, integer);
DROP FUNCTION IF EXISTS public.app_log_errors_by_source(timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.app_log_errors_by_path(timestamptz, timestamptz, integer);
DROP FUNCTION IF EXISTS public.app_log_platform_bucket_counts(timestamptz, timestamptz, text);
DROP FUNCTION IF EXISTS public.app_log_interaction_bucket_counts(timestamptz, timestamptz, text);
DROP FUNCTION IF EXISTS public.app_log_error_bucket_counts(timestamptz, timestamptz, text);
DROP TABLE IF EXISTS public.app_platform_events CASCADE;
DROP TABLE IF EXISTS public.app_error_events CASCADE;
DROP TABLE IF EXISTS public.app_interaction_events CASCADE;

-- Drop app functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS extract_text_from_content(JSONB);
DROP FUNCTION IF EXISTS update_note_content_text();
DROP FUNCTION IF EXISTS create_note_version();
DROP FUNCTION IF EXISTS cleanup_old_versions();

-- pgvector (after all tables/functions using vector columns are dropped)
DROP EXTENSION IF EXISTS vector CASCADE;
