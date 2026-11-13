-- 13.11.2026: «Афіша без барʼєрів» — події й кіноанонси, які Богдан додає з адмінки /admin/afisha.
create table if not exists public.afisha_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('event','film')),
  date date not null,
  time text,
  title text not null,
  category text,
  venue text,
  city text,
  studio text,
  genre text,
  director text,
  cast_text text,
  about text,
  book text,
  trailer text,
  source text,
  distributor text,
  access text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.afisha_items enable row level security;
create index if not exists afisha_items_date_idx on public.afisha_items (date);
