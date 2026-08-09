-- Згода автора на публікацію конкретного твору.
--
-- Навіщо окрема таблиця, а не просто зміна content.status: статус
-- показує, де твір зараз, і його змінює хто завгодно з адмінки. Згода —
-- це юридичний факт: хто, коли і з якої адреси дозволив публікацію.
-- Її не можна втратити при наступній зміні статусу.
--
-- Записуємо IP і user-agent: якщо колись дійде до спору про права,
-- «автор натиснув кнопку» без сліду в базі не доводить нічого.

create table if not exists public.publish_consents (
  content_id   uuid not null references public.content(id) on delete cascade,
  author_id    uuid not null references auth.users(id) on delete cascade,
  consented_at timestamptz not null default now(),
  ip           text,
  user_agent   text,
  primary key (content_id)
);

create index if not exists publish_consents_author_idx
  on public.publish_consents (author_id, consented_at desc);

alter table public.publish_consents enable row level security;

-- Автор бачить лише свої згоди. Записує їх API від імені service role
-- після перевірки права на твір — тому insert-політики для клієнта немає.
drop policy if exists "own consents select" on public.publish_consents;
create policy "own consents select"
  on public.publish_consents for select
  using (auth.uid() = author_id);
