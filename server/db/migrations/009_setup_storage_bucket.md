# Supabase Storage Setup for Note Attachments

This migration document describes how to set up Supabase Storage for file attachments in the notes application.

## Steps

1. **Create Storage Bucket**
   - Go to your Supabase project dashboard
   - Navigate to **Storage** → **Buckets**
   - Click **New bucket**
   - Name: `note-attachments`
   - Public: **No** (private bucket)
   - File size limit: 10MB (or your preferred limit)
   - Allowed MIME types: Leave empty to allow all types, or specify allowed types
   - **IMPORTANT**: Make sure **"Enable RLS"** is **DISABLED** (unchecked)
     - The service role key will handle access control server-side
     - RLS on storage buckets can cause "row-level security policy" errors

2. **Disable RLS on Storage Bucket** (Critical!)
   - After creating the bucket, go to **Storage** → **Buckets** → `note-attachments`
   - Click the **Settings** (gear icon) or **Edit bucket**
   - **Uncheck "Enable RLS"** or set it to **Disabled**
   - Click **Save**

3. **Alternative: If RLS Must Stay Enabled**
   - If you need RLS enabled, create policies that allow service role access:
   - Go to **Storage** → **Policies** → `note-attachments`
   - Create policy for INSERT: Allow service role to insert
   - Create policy for SELECT: Allow service role to select
   - Create policy for DELETE: Allow service role to delete
   - **Note**: This is more complex and not recommended if using service role server-side

4. **Verify Configuration**
   - The bucket should be accessible via the Supabase client using the service role key
   - Files will be stored at: `notes/{userId}/{noteId}/{timestamp}-{filename}`
   - Test by trying to upload a file - it should work without RLS errors

## Environment Variables

No additional environment variables are needed. The existing Supabase configuration is used:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

If you get "new row violates row-level security policy" errors:

**Option 1: Disable RLS on Bucket (Recommended)**
1. Go to **Storage** → **Buckets** → `note-attachments`
2. Click **Settings** (gear icon)
3. **Uncheck "Enable RLS"** or set it to **Disabled**
4. Click **Save**

**Option 2: Create Storage RLS Policies**
If you need to keep RLS enabled, run the SQL migration `011_create_storage_policies.sql`:
1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the contents of `011_create_storage_policies.sql`
3. Click **Run**

**Additional Checks:**
- Verify you're using the **service role key** (not anon key) in your `.env`
- Restart your server after changing environment variables
- Ensure the bucket name is exactly `note-attachments` (case-sensitive)

## Testing

After setup, test file upload:
1. Create a note
2. Upload a file attachment
3. Verify the file appears in the attachments list
4. Download the file to verify it works
