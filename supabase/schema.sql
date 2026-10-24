-- Sell It: run once in the Supabase SQL editor.
-- The app talks to these tables only from the server with the service-role key, so RLS stays on with no policies.

create table if not exists listings (
  id text primary key,
  slug text unique not null,
  created_at timestamptz not null default now(),
  seller_name text not null,
  seller_whatsapp text not null,
  listing_type text not null,
  title text not null,
  price integer not null,
  images text[] not null default '{}',
  data jsonb not null
);

create table if not exists feedback (
  id text primary key,
  created_at timestamptz not null default now(),
  listing_slug text,
  thumbs text,
  where_posting text[] not null default '{}',
  comment text not null default ''
);

create table if not exists events (
  id text primary key,
  created_at timestamptz not null default now(),
  listing_slug text,
  name text not null,
  channel text
);

alter table listings enable row level security;
alter table feedback enable row level security;
alter table events enable row level security;

-- Public bucket for listing photos (the listing page shows them to anyone with the link).
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- AgenticOrg agent runs: timestamped agent activity log (proof of life).
create table if not exists agent_runs (
  id text primary key,
  created_at timestamptz not null default now(),
  agent text not null,
  agent_id text,
  listing_slug text,
  status text not null,
  confidence double precision,
  inputs jsonb,
  output jsonb,
  raw jsonb
);
alter table agent_runs enable row level security;
