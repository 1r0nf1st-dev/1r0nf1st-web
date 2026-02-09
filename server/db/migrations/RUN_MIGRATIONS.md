# Running Supabase Migrations

To fix the RLS error when uploading attachments, you need to run migration 008 to disable RLS on the attachments table.

## Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `008_disable_notes_rls.sql`
4. Click **Run** to execute the migration

## Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

Or run the specific migration:

```bash
psql $DATABASE_URL -f server/db/migrations/008_disable_notes_rls.sql
```

## Quick Fix SQL

If you just need to fix the attachments table immediately, run this in the SQL Editor:

```sql
ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;
```

## Verify RLS is Disabled

After running the migration, verify RLS is disabled:

1. Go to **Table Editor** → `attachments`
2. Click **Settings** (gear icon)
3. Check **Row Level Security** - it should show as disabled

## Storage uploads still failing with "new row violates row-level security policy"?

If server-side uploads to the `note-attachments` bucket still return 403 RLS:

1. **Use the real service role key**  
   In **Project Settings → API**, copy the **service_role** key (the long JWT starting with `eyJ...`). Put it in `.env` as `SUPABASE_SERVICE_ROLE_KEY` and restart the server. Do not use the anon key.

2. **Add Storage policies for the service role**  
   In **SQL Editor**, run the contents of `012_storage_service_role_policy.sql`. That adds RLS policies on `storage.objects` so the service role can insert/select/delete in the `note-attachments` bucket.

## Note

The service role key should bypass RLS, but disabling RLS ensures there are no policy conflicts. This aligns with how the `goals` table is configured in this project.
