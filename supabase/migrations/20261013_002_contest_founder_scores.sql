-- Оцінка засновника (Богдана) для конкурсних творів, 13.10.2026.
-- Ставиться після прочитання, поруч з оцінкою ШІ й оцінкою редактора.
-- Одна оцінка на заявку; правити можна (на відміну від редакторської).
create table if not exists public.contest_founder_scores (
  entry_id    text primary key,
  score       int  not null check (score between 0 and 100),
  comment     text not null default '',
  updated_at  timestamptz not null default now()
);
alter table public.contest_founder_scores enable row level security;
