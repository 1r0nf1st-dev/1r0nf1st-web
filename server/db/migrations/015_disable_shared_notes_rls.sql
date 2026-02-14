-- Disable RLS for shared_notes table
-- All access is via service_role (server-side), so RLS is not needed
-- The application code enforces authorization (checking owner_id, etc.)

ALTER TABLE shared_notes DISABLE ROW LEVEL SECURITY;
