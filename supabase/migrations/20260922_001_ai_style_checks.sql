-- Визначальник стилю (ознаки можливого використання ШІ) і відповіді авторів.
--
-- author_applications.answers — відповіді на 10 запитань форми заявки
-- (lib/author-questions.ts), jsonb { q1: '…', … }.
--
-- ai_style_checks — результати перевірок. text_hash = sha256(текст + відповіді):
-- повторна перевірка того самого тексту бере збережений результат і не
-- платить за модель вдруге (якщо не натиснуто «перевірити заново»).

alter table public.author_applications add column if not exists answers jsonb;

create table if not exists public.ai_style_checks (
  id          bigserial primary key,
  source      text not null check (source in ('application', 'contest', 'content', 'manual')),
  source_id   text,
  title       text,
  text_hash   text not null,
  words       int  not null,
  stats       jsonb not null,
  result      jsonb not null,
  model       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists ai_style_checks_hash_idx on public.ai_style_checks (text_hash, created_at desc);
create index if not exists ai_style_checks_source_idx on public.ai_style_checks (source, source_id, created_at desc);

-- Лише для адмінки через пряме підключення; клієнтських політик немає.
alter table public.ai_style_checks enable row level security;
