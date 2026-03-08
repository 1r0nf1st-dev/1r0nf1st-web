-- Second Brain: Use public schema (avoids "Invalid schema" / PostgREST exposure)
-- Tables: sb_thoughts, sb_projects, sb_people, sb_ideas, sb_admin, sb_resources
-- Run via Supabase SQL Editor. Requires: pgvector (021) and update_updated_at_column (002)

-- sb_thoughts
create table if not exists public.sb_thoughts (
  id          uuid primary key default gen_random_uuid(),
  raw_text    text not null,
  source      text,
  category    text,
  confidence  int,
  routed      boolean default false,
  embedding   vector(768),
  created_at  timestamptz default now()
);

-- sb_projects
create table if not exists public.sb_projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  goal        text,
  next_action text,
  status      text default 'active',
  due_date    date,
  area        text,
  notes       text,
  embedding   vector(768),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- sb_people
create table if not exists public.sb_people (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  relationship     text,
  last_interaction date,
  follow_up_date   date,
  notes            text,
  embedding        vector(768),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- sb_ideas
create table if not exists public.sb_ideas (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  area       text,
  status     text default 'raw',
  embedding  vector(768),
  created_at timestamptz default now()
);

-- sb_admin
create table if not exists public.sb_admin (
  id         uuid primary key default gen_random_uuid(),
  task       text not null,
  due_date   date,
  status     text default 'pending',
  notes      text,
  embedding  vector(768),
  created_at timestamptz default now()
);

-- sb_resources
create table if not exists public.sb_resources (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  url        text,
  summary    text,
  tags       text[],
  embedding  vector(768),
  created_at timestamptz default now()
);

-- search_all in public (no schema exposure needed)
create or replace function public.sb_search_all(
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
  from public.sb_projects
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  union all
  select 'people'::text, id, name, notes,
         (1 - (embedding <=> query_embedding))::float as similarity, created_at
  from public.sb_people
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  union all
  select 'ideas'::text, id, title, body,
         (1 - (embedding <=> query_embedding))::float as similarity, created_at
  from public.sb_ideas
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  union all
  select 'admin'::text, id, task, notes,
         (1 - (embedding <=> query_embedding))::float as similarity, created_at
  from public.sb_admin
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  union all
  select 'resources'::text, id, title, summary,
         (1 - (embedding <=> query_embedding))::float as similarity, created_at
  from public.sb_resources
  where embedding is not null and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- HNSW indexes
create index if not exists idx_sb_projects_emb on public.sb_projects using hnsw (embedding vector_cosine_ops);
create index if not exists idx_sb_people_emb on public.sb_people using hnsw (embedding vector_cosine_ops);
create index if not exists idx_sb_ideas_emb on public.sb_ideas using hnsw (embedding vector_cosine_ops);
create index if not exists idx_sb_admin_emb on public.sb_admin using hnsw (embedding vector_cosine_ops);
create index if not exists idx_sb_resources_emb on public.sb_resources using hnsw (embedding vector_cosine_ops);

-- triggers (drop first if rerunning)
drop trigger if exists update_sb_projects_updated_at on public.sb_projects;
create trigger update_sb_projects_updated_at
  before update on public.sb_projects
  for each row execute function update_updated_at_column();
drop trigger if exists update_sb_people_updated_at on public.sb_people;
create trigger update_sb_people_updated_at
  before update on public.sb_people
  for each row execute function update_updated_at_column();

-- RLS
alter table public.sb_thoughts enable row level security;
alter table public.sb_projects enable row level security;
alter table public.sb_people enable row level security;
alter table public.sb_ideas enable row level security;
alter table public.sb_admin enable row level security;
alter table public.sb_resources enable row level security;
