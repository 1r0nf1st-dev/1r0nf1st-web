-- Ensure RLS is disabled on attachments table
-- This migration ensures RLS is disabled even if migration 008 wasn't run
-- Run this in your Supabase SQL Editor if you're getting RLS errors

ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled (this will show the current RLS status)
-- You can check in Supabase Dashboard: Table Editor → attachments → Settings → Row Level Security
