-- Second Brain: Enable pgvector, schema, tables, search_all, HNSW indexes
-- Embedding model: text-embedding-004 (768 dimensions)
-- Run via Supabase SQL Editor or: psql $DATABASE_URL -f server/db/migrations/021_second_brain_tables.sql

create extension if not exists vector;
create schema if not exists second_brain;

-- thoughts: raw inbox before routing (Make.com or in-app capture stages here)
create table if not exists second_brain.thoughts (
  id          uuid primary key default gen_random_uuid(),
  raw_text    text not null,
  source      text,                    -- 'telegram', 'email', 'manual', 'web'
  category    text,                    -- 'PROJECTS','PEOPLE','IDEAS','ADMIN','RESOURCES','REVIEW'
  confidence  int,                     -- AI confidence 0–100
  routed      boolean default false,
  embedding   vector(768),
  created_at  timestamptz default now()
);

-- projects
create table if not exists second_brain.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  goal        text,
  next_action text,
  status      text default 'active',   -- 'active', 'paused', 'done'
  due_date    date,
  area        text,
  notes       text,
  embedding   vector(768),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- people
create table if not exists second_brain.people (
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

-- ideas
create table if not exists second_brain.ideas (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  area       text,
  status     text default 'raw',       -- 'raw', 'developing', 'done'
  embedding  vector(768),
  created_at timestamptz default now()
);

-- admin (tasks)
create table if not exists second_brain.admin (
  id         uuid primary key default gen_random_uuid(),
  task       text not null,
  due_date   date,
  status     text default 'pending',   -- 'pending', 'done'
  notes      text,
  embedding  vector(768),
  created_at timestamptz default now()
);

-- resources
create table if not exists second_brain.resources (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  url        text,
  summary    text,
  tags       text[],
  embedding  vector(768),
  created_at timestamptz default now()
);
