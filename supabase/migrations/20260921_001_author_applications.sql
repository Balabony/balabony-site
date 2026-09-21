-- Заявки авторів: пробна історія, подана з сайту.
--
-- До 21.09.2026 автори писали на пошту, а редакція заводила кожного вручну
-- в /admin/authors. Тепер людина входить сама (Google або код із пошти),
-- подає пробну історію формою на /become-author, а редакція в
-- /admin/zayavky-avtoriv натискає «Прийняти» або «Відхилити».
--
-- Модель «редакція вирішує» лишається: кабінет автора (author_profiles)
-- з'являється тільки після «Прийняти». Сам вхід на сайт ще не робить
-- людину автором — див. коментар у /api/admin/create-author.
--
-- IP і user-agent пишемо разом зі згодою: «натиснув галочку» без сліду
-- в базі нічого не доводить (та сама логіка, що в publish_consents).

create table if not exists public.author_applications (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  pen_name    text,
  phone       text not null,
  title       text not null,
  genre       text,
  body        text not null,
  words       int  not null,
  filename    text,
  consent_ip  text,
  consent_ua  text,
  status      text not null default 'new' check (status in ('new', 'accepted', 'rejected')),
  admin_note  text,
  content_id  uuid,
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Одна нерозглянута заявка на людину: поки редакція не відповіла,
-- другу подати не можна (захист від дублів і засмічення черги).
create unique index if not exists author_applications_one_new
  on public.author_applications (user_id) where status = 'new';

create index if not exists author_applications_status_idx
  on public.author_applications (status, created_at desc);

alter table public.author_applications enable row level security;

-- Людина бачить лише свої заявки. Пише й читає чуже тільки API
-- з прямим підключенням, тому insert/update-політик для клієнта немає.
drop policy if exists "own applications select" on public.author_applications;
create policy "own applications select"
  on public.author_applications for select
  using (auth.uid() = user_id);
