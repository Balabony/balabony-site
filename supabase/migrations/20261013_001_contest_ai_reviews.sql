-- Оцінка конкурсних творів ШІ (паралельна й незалежна від редакторів), 13.10.2026.
-- Кабінет редактора цю таблицю не читає. text_hash — щоб не платити за той самий текст двічі.
create table if not exists public.contest_ai_reviews (
  id          bigserial primary key,
  entry_id    text not null,
  contest     text not null,
  text_hash   text not null,
  words       int  not null default 0,
  total       int  not null,
  model       text not null,
  result      jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists contest_ai_reviews_entry_idx on public.contest_ai_reviews (entry_id, created_at desc);

-- Лише для адмінки через пряме підключення; клієнтських політик немає.
alter table public.contest_ai_reviews enable row level security;
