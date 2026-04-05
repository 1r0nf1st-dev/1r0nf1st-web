-- One-off rollout for existing Supabase projects (tables + app_log_* RPCs already exist).
-- Run in Supabase Dashboard → SQL Editor. Idempotent-safe to re-run.
-- After this: anon/authenticated cannot read log tables or call reporting RPCs via PostgREST;
-- Express continues to work (service_role bypasses RLS and retains RPC execute).
-- Keep in sync with the app logging section of scripts/db-bootstrap.sql.

ALTER TABLE public.app_interaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_platform_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "block_anon_authenticated_app_interaction_events" ON public.app_interaction_events;
CREATE POLICY "block_anon_authenticated_app_interaction_events"
  ON public.app_interaction_events FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "block_anon_authenticated_app_error_events" ON public.app_error_events;
CREATE POLICY "block_anon_authenticated_app_error_events"
  ON public.app_error_events FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "block_anon_authenticated_app_platform_events" ON public.app_platform_events;
CREATE POLICY "block_anon_authenticated_app_platform_events"
  ON public.app_platform_events FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

REVOKE EXECUTE ON FUNCTION public.app_log_error_bucket_counts(TIMESTAMPTZ, TIMESTAMPTZ, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.app_log_interaction_bucket_counts(TIMESTAMPTZ, TIMESTAMPTZ, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.app_log_platform_bucket_counts(TIMESTAMPTZ, TIMESTAMPTZ, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.app_log_errors_by_path(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.app_log_errors_by_source(TIMESTAMPTZ, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.app_log_interactions_by_path(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.app_log_error_bucket_counts(TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.app_log_interaction_bucket_counts(TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.app_log_platform_bucket_counts(TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.app_log_errors_by_path(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.app_log_errors_by_source(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.app_log_interactions_by_path(TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) TO service_role;
