-- Explicit RLS policies for service_role on storage.objects
-- Use this if server-side uploads with SUPABASE_SERVICE_ROLE_KEY still get
-- "new row violates row-level security policy" (e.g. some Supabase projects
-- enforce Storage RLS even for the service role).

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Allow service_role uploads to note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role reads from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role deletes from note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow service_role updates in note-attachments" ON storage.objects;

-- Service role: allow INSERT (upload) to note-attachments bucket
CREATE POLICY "Allow service_role uploads to note-attachments"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'note-attachments');

-- Service role: allow SELECT (read/download) from note-attachments bucket
CREATE POLICY "Allow service_role reads from note-attachments"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'note-attachments');

-- Service role: allow DELETE from note-attachments bucket
CREATE POLICY "Allow service_role deletes from note-attachments"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'note-attachments');

-- Service role: allow UPDATE (e.g. upsert) if needed
CREATE POLICY "Allow service_role updates in note-attachments"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'note-attachments')
WITH CHECK (bucket_id = 'note-attachments');
