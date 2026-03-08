-- Expose second_brain schema to PostgREST so the Supabase JS client can access it
-- Run this in Supabase SQL Editor after 021 and 022
-- Fixes: "Invalid schema: second_brain" when using supabase.schema('second_brain')

alter role authenticator set pgrst.db_schemas = 'public, second_brain';
