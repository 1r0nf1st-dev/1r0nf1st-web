-- Alternative RLS policies for service_role on storage.objects
-- Use this if 012_storage_service_role_policy.sql did not fix uploads.
-- Some Supabase projects use JWT role rather than TO service_role for Storage.

-- Drop existing policies from 012 (to avoid conflicts)
DROP POLICY IF EXISTS "Allow service_role uploads to note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role reads from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role deletes from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role updates in note-attachments" ON storage.objects;

-- Drop policies we're about to create (for re-running)
DROP POLICY IF EXISTS "Allow service_role uploads via JWT" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role reads via JWT" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role deletes via JWT" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role updates via JWT" ON storage.objects;

-- Policy using JWT role check (works when Storage API passes role in JWT)
CREATE POLICY "Allow service_role uploads via JWT"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'note-attachments'
  AND (auth.jwt() ->> 'role' = 'service_role')
);

CREATE POLICY "Allow service_role reads via JWT"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'note-attachments'
  AND (auth.jwt() ->> 'role' = 'service_role')
);

CREATE POLICY "Allow service_role deletes via JWT"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'note-attachments'
  AND (auth.jwt() ->> 'role' = 'service_role')
);

CREATE POLICY "Allow service_role updates via JWT"
ON storage.objects FOR UPDATE
USING (bucket_id = 'note-attachments' AND (auth.jwt() ->> 'role' = 'service_role'))
WITH CHECK (bucket_id = 'note-attachments');
