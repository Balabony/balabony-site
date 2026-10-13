-- Перевірка конкурсних творів на попередню публікацію в інтернеті, 14.10.2026.
create table if not exists public.contest_originality_checks (
  id          bigserial primary key,
  entry_id    text not null,
  text_hash   text not null,
  verdict     text not null,
  result      jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists contest_originality_entry_idx on public.contest_originality_checks (entry_id, created_at desc);
alter table public.contest_originality_checks enable row level security;
