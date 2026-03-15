-- Migration: Add updated_at to sb_thoughts, sb_ideas, sb_resources
-- Usage: psql $DATABASE_URL -f scripts/migrations/add-sb-updated-at.sql
-- Prerequisite: update_updated_at_column() function must exist (from db-bootstrap.sql)

ALTER TABLE public.sb_thoughts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.sb_ideas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.sb_resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_sb_thoughts_updated_at ON public.sb_thoughts;
CREATE TRIGGER update_sb_thoughts_updated_at
  BEFORE UPDATE ON public.sb_thoughts FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sb_ideas_updated_at ON public.sb_ideas;
CREATE TRIGGER update_sb_ideas_updated_at
  BEFORE UPDATE ON public.sb_ideas FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sb_resources_updated_at ON public.sb_resources;
CREATE TRIGGER update_sb_resources_updated_at
  BEFORE UPDATE ON public.sb_resources FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
