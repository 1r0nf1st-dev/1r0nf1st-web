-- Disable Row Level Security on goals and goal_milestones tables
-- We handle authentication and authorization in the application layer
-- The service role key is used server-side, so RLS is not needed

ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones DISABLE ROW LEVEL SECURITY;
