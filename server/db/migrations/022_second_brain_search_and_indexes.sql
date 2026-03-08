-- Second Brain: Cross-table semantic search function + HNSW indexes
-- Run 021 first. Run via Supabase SQL Editor or: psql $DATABASE_URL -f server/db/migrations/022_second_brain_search_and_indexes.sql

create or replace function second_brain.search_all(
  query_embedding vector(768),
  match_threshold float default 0.70,
  match_count     int   default 5
)
returns table (
  table_name text,
  record_id  uuid,
  label      text,
  detail     text,
  similarity float,
  created_at timestamptz
)
language sql stable as $$
  select 'projects'::text, id, name, notes,
         (1 - (embedding <=> query_embedding))::float as similarity, created_at
  from second_brain.projects
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  union all
  select 'people'::text, id, name, notes,
         (1 - (embedding <=> query_embedding))::float as similarity, created_at
  from second_brain.people
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  union all
  select 'ideas'::text, id, title, body,
         (1 - (embedding <=> query_embedding))::float as similarity, created_at
  from second_brain.ideas
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  union all
  select 'admin'::text, id, task, notes,
         (1 - (embedding <=> query_embedding))::float as similarity, created_at
  from second_brain.admin
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  union all
  select 'resources'::text, id, title, summary,
         (1 - (embedding <=> query_embedding))::float as similarity, created_at
  from second_brain.resources
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- HNSW indexes for fast semantic search
create index if not exists idx_sb_projects_embedding
  on second_brain.projects using hnsw (embedding vector_cosine_ops);
create index if not exists idx_sb_people_embedding
  on second_brain.people using hnsw (embedding vector_cosine_ops);
create index if not exists idx_sb_ideas_embedding
  on second_brain.ideas using hnsw (embedding vector_cosine_ops);
create index if not exists idx_sb_admin_embedding
  on second_brain.admin using hnsw (embedding vector_cosine_ops);
create index if not exists idx_sb_resources_embedding
  on second_brain.resources using hnsw (embedding vector_cosine_ops);

-- updated_at triggers (uses update_updated_at_column from migration 002)
create trigger update_sb_projects_updated_at
  before update on second_brain.projects
  for each row execute function update_updated_at_column();
create trigger update_sb_people_updated_at
  before update on second_brain.people
  for each row execute function update_updated_at_column();

-- Enable RLS: deny anon/authenticated; service role bypasses and continues to work
alter table second_brain.thoughts enable row level security;
alter table second_brain.projects enable row level security;
alter table second_brain.people enable row level security;
alter table second_brain.ideas enable row level security;
alter table second_brain.admin enable row level security;
alter table second_brain.resources enable row level security;
