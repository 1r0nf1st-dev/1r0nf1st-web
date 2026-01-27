# Supabase Setup Instructions

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → This is your `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Important**: Use the `service_role` key, NOT the `anon` key. The service role key has admin privileges needed for server-side operations.

## Step 2: Create the Users Table

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the following SQL to create the users table:

```sql
-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

3. Click **Run** to execute the SQL

## Step 3: Add Credentials to .env File

Add these to your `.env` file:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Replace with your actual values from Step 1.

## Step 4: Test the Setup

1. Start your server: `pnpm dev`
2. The default admin user will be automatically created on first run:
   - Username: `admin`
   - Password: `admin123`
3. Try logging in at `/login` with these credentials

## Notes

- The `service_role` key has full database access. Keep it secret and never expose it in client-side code.
- Users are now stored permanently in Supabase and will persist across server restarts.
- The default admin user is created automatically if it doesn't exist.
