-- Drop unused public.users table (legacy; auth uses auth.users)
-- No application code or other tables reference this table
DROP TABLE IF EXISTS public.users;
