-- Create RLS policies for storage.objects to allow uploads via presigned URLs
-- This is required even when using service role key because presigned URLs
-- operate under normal RLS constraints

-- Allow authenticated users to upload files to note-attachments bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to note-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'note-attachments'
);

-- Allow authenticated users to read files from note-attachments bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated reads from note-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'note-attachments'
);

-- Allow authenticated users to delete files from note-attachments bucket
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes from note-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'note-attachments'
);

-- Note: If you prefer to disable RLS entirely on the bucket instead,
-- you can do that in the Supabase Dashboard:
-- Storage → Buckets → note-attachments → Settings → Disable "Enable RLS"
