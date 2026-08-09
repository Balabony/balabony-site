-- Підписка читача на автора.
--
-- Тільки для зареєстрованих: на відміну від лайків, підписка має сенс лише
-- тоді, коли є кому показати нові твори. Анонімний visitor_id живе до
-- чистки браузера, і стрічка на його основі загубилася б разом із ним.
--
-- Обидва боки — user_id з auth.users: читач може сам виявитися автором,
-- і окрема таблиця «читачів» тут нічого не додала б.

create table if not exists public.author_follows (
  follower_id      uuid not null references auth.users(id) on delete cascade,
  author_user_id   uuid not null references auth.users(id) on delete cascade,
  created_at       timestamptz not null default now(),
  primary key (follower_id, author_user_id)
);

-- Стрічка читача: «за ким я стежу», найновіші підписки зверху.
create index if not exists author_follows_follower_idx
  on public.author_follows (follower_id, created_at desc);

-- Лічильник на сторінці автора і статистика в кабінеті.
create index if not exists author_follows_author_idx
  on public.author_follows (author_user_id);

-- На себе підписатися не можна: у стрічці власних новинок немає сенсу,
-- а лічильник це б накрутило.
alter table public.author_follows
  drop constraint if exists author_follows_not_self;
alter table public.author_follows
  add constraint author_follows_not_self
  check (follower_id <> author_user_id);

alter table public.author_follows enable row level security;

-- Читач бачить і керує лише своїми підписками. Лічильник для публічної
-- сторінки рахує service role в API — інакше довелося б відкривати
-- сторонньому читачеві повний список чужих підписок.
drop policy if exists "own follows select" on public.author_follows;
create policy "own follows select"
  on public.author_follows for select
  using (auth.uid() = follower_id);

drop policy if exists "own follows insert" on public.author_follows;
create policy "own follows insert"
  on public.author_follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "own follows delete" on public.author_follows;
create policy "own follows delete"
  on public.author_follows for delete
  using (auth.uid() = follower_id);
