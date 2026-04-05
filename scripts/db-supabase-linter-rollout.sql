-- One-off rollout for existing Supabase projects (schema already applied from older bootstrap).
-- Run in Supabase Dashboard → SQL Editor once. Keep in sync with scripts/db-bootstrap.sql.
-- Order: extensions → move vector → replace search RPCs → lock EXECUTE → RLS policies.
-- If ALTER EXTENSION fails with "extension is not in schema public", it is already in extensions — skip that step.

-- 1) pgvector out of public (Supabase linter)
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
ALTER EXTENSION vector SET SCHEMA extensions;

-- 2) Immutable search_path on vector RPCs + service_role-only EXECUTE
CREATE OR REPLACE FUNCTION public.sb_search_all(
  query_embedding vector(768), match_threshold float DEFAULT 0.70, match_count int DEFAULT 5
)
RETURNS TABLE (table_name text, record_id uuid, label text, detail text, similarity float, created_at timestamptz)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  SELECT 'projects'::text, id, name, notes, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_projects WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  UNION ALL SELECT 'people'::text, id, name, notes, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_people WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  UNION ALL SELECT 'ideas'::text, id, title, body, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_ideas WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  UNION ALL SELECT 'admin'::text, id, task, notes, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_admin WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  UNION ALL SELECT 'resources'::text, id, title, summary, (1 - (embedding <=> query_embedding))::float AS similarity, created_at FROM public.sb_resources WHERE embedding IS NOT NULL AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.ob_search_nodes(
  query_embedding    vector(768),
  match_threshold    FLOAT DEFAULT 0.70,
  match_count        INT DEFAULT 10,
  owner_id           UUID DEFAULT NULL,
  filter_node_type   ob_node_type DEFAULT NULL
)
RETURNS TABLE (
  id           UUID,
  title        TEXT,
  body         TEXT,
  node_type    ob_node_type,
  ai_summary   TEXT,
  ai_tags      TEXT[],
  user_tags    TEXT[],
  user_id      UUID,
  similarity   FLOAT
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  SELECT
    n.id, n.title, n.body, n.node_type,
    n.ai_summary, n.ai_tags, n.user_tags, n.user_id,
    1 - (n.embedding <=> query_embedding) AS similarity
  FROM public.ob_nodes n
  WHERE
    (
      (owner_id IS NULL AND n.visibility = 'public')
      OR
      (owner_id IS NOT NULL AND n.user_id = owner_id)
    )
    AND (filter_node_type IS NULL OR n.node_type = filter_node_type)
    AND n.embedding IS NOT NULL
    AND 1 - (n.embedding <=> query_embedding) > match_threshold
  ORDER BY n.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.ob_search_all_brain(
  query_embedding  vector(768),
  owner_id         UUID,
  match_threshold  FLOAT DEFAULT 0.55,
  match_count      INT DEFAULT 15,
  viewer_id        UUID DEFAULT NULL
)
RETURNS TABLE (
  source_table  TEXT,
  record_id     UUID,
  label         TEXT,
  detail        TEXT,
  similarity    FLOAT,
  created_at    TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT * FROM (
    SELECT 'ob_nodes'::text AS source_table, id AS record_id, title AS label, COALESCE(ai_summary, body, '') AS detail,
      (1 - (embedding <=> query_embedding))::float AS similarity, created_at
    FROM public.ob_nodes
    WHERE user_id = owner_id AND embedding IS NOT NULL
      AND (
        visibility = 'public'
        OR (viewer_id IS NOT NULL AND viewer_id = owner_id)
      )
      AND 1 - (embedding <=> query_embedding) > match_threshold
    UNION ALL
    SELECT 'sb_thoughts'::text, id, LEFT(raw_text, 200), COALESCE(raw_text, ''),
      (1 - (embedding <=> query_embedding))::float, created_at
    FROM public.sb_thoughts WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> query_embedding) > match_threshold
    UNION ALL
    SELECT 'sb_projects'::text, id, name, COALESCE(notes, ''),
      (1 - (embedding <=> query_embedding))::float, created_at
    FROM public.sb_projects WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> query_embedding) > match_threshold
    UNION ALL
    SELECT 'sb_ideas'::text, id, title, COALESCE(body, ''),
      (1 - (embedding <=> query_embedding))::float, created_at
    FROM public.sb_ideas WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> query_embedding) > match_threshold
    UNION ALL
    SELECT 'sb_resources'::text, id, title, COALESCE(summary, ''),
      (1 - (embedding <=> query_embedding))::float, created_at
    FROM public.sb_resources WHERE embedding IS NOT NULL
      AND 1 - (embedding <=> query_embedding) > match_threshold
  ) sub
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

REVOKE EXECUTE ON FUNCTION public.sb_search_all(vector, double precision, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ob_search_nodes(vector, double precision, integer, uuid, ob_node_type)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ob_search_all_brain(vector, uuid, double precision, integer, uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.sb_search_all(vector, double precision, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.ob_search_nodes(vector, double precision, integer, uuid, ob_node_type) TO service_role;
GRANT EXECUTE ON FUNCTION public.ob_search_all_brain(vector, uuid, double precision, integer, uuid) TO service_role;

-- 3) ob_ai_sessions: replace permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create an ob_ai_session" ON public.ob_ai_sessions;
DROP POLICY IF EXISTS "authenticated_insert_own_ob_ai_sessions" ON public.ob_ai_sessions;
CREATE POLICY "authenticated_insert_own_ob_ai_sessions"
  ON public.ob_ai_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4) Explicit deny policies for anon/authenticated (Supabase "RLS enabled but no policies")
DROP POLICY IF EXISTS "block_anon_authenticated_sb_thought_attachments" ON public.sb_thought_attachments;
CREATE POLICY "block_anon_authenticated_sb_thought_attachments"
  ON public.sb_thought_attachments FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "block_anon_authenticated_sb_thoughts" ON public.sb_thoughts;
CREATE POLICY "block_anon_authenticated_sb_thoughts"
  ON public.sb_thoughts FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "block_anon_authenticated_sb_projects" ON public.sb_projects;
CREATE POLICY "block_anon_authenticated_sb_projects"
  ON public.sb_projects FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "block_anon_authenticated_sb_people" ON public.sb_people;
CREATE POLICY "block_anon_authenticated_sb_people"
  ON public.sb_people FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "block_anon_authenticated_sb_ideas" ON public.sb_ideas;
CREATE POLICY "block_anon_authenticated_sb_ideas"
  ON public.sb_ideas FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "block_anon_authenticated_sb_admin" ON public.sb_admin;
CREATE POLICY "block_anon_authenticated_sb_admin"
  ON public.sb_admin FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "block_anon_authenticated_sb_resources" ON public.sb_resources;
CREATE POLICY "block_anon_authenticated_sb_resources"
  ON public.sb_resources FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "block_anon_authenticated_app_interaction_events" ON public.app_interaction_events;
CREATE POLICY "block_anon_authenticated_app_interaction_events"
  ON public.app_interaction_events FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "block_anon_authenticated_app_error_events" ON public.app_error_events;
CREATE POLICY "block_anon_authenticated_app_error_events"
  ON public.app_error_events FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "block_anon_authenticated_app_platform_events" ON public.app_platform_events;
CREATE POLICY "block_anon_authenticated_app_platform_events"
  ON public.app_platform_events FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- PL/pgSQL helpers: fixed search_path (Supabase linter). Idempotent.
-- If is_share_expired(shared_notes) fails, use \df is_share_expired in psql for exact arg types.
ALTER FUNCTION update_updated_at_column() SET search_path = public;
ALTER FUNCTION extract_text_from_content(jsonb) SET search_path = public;
ALTER FUNCTION update_note_content_text() SET search_path = public;
ALTER FUNCTION is_share_expired(shared_notes) SET search_path = public;
ALTER FUNCTION create_note_version() SET search_path = public;
ALTER FUNCTION cleanup_old_versions() SET search_path = public;
ALTER FUNCTION public.handle_new_ob_user() SET search_path = public;
