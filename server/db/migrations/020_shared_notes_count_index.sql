-- Speed up shared notes count queries for sidebar badge.
-- Avoid non-immutable predicates (e.g. NOW()) in partial indexes.
CREATE INDEX IF NOT EXISTS idx_shared_notes_user_active
  ON shared_notes(shared_with_user_id)
  WHERE expires_at IS NULL;
