-- Прочитання: один раз на добу замість одного разу назавжди
--
-- Договір, п. 1.5: прочитання зараховується не частіше одного разу на добу.
-- Досі унікальність стояла на парі (user_id, content_id), тобто постійний
-- читач давав авторові рівно одне прочитання за весь час. Додаємо дату.
--
-- Дата київська: доба має закінчуватися опівночі за Києвом, інакше вечірнє
-- читання попадало б у наступний день.
--
-- Виконувати в SQL-редакторі Supabase:
-- https://supabase.com/dashboard/project/swwzsrtbfjsdsmpgfpsk/sql/new

-- 1. Нове поле. Для наявних рядків беремо дату з opened_at або read_at,
--    щоб історія не з'їхала на сьогоднішнє число.
alter table public.article_reads
  add column if not exists read_date date;

update public.article_reads
   set read_date = (coalesce(opened_at, read_at, created_at, now()) at time zone 'Europe/Kyiv')::date
 where read_date is null;

alter table public.article_reads
  alter column read_date set default (now() at time zone 'Europe/Kyiv')::date;

alter table public.article_reads
  alter column read_date set not null;

-- 2. Старий ключ прибираємо, новий ставимо.
--    Назва обмеження може відрізнятися — рядок нижче знайде її сам.
do $$
declare
  con text;
begin
  select conname into con
    from pg_constraint
   where conrelid = 'public.article_reads'::regclass
     and contype = 'u'
     and pg_get_constraintdef(oid) like '%user_id%content_id%'
     and pg_get_constraintdef(oid) not like '%read_date%'
   limit 1;

  if con is not null then
    execute format('alter table public.article_reads drop constraint %I', con);
  end if;
end $$;

-- Індекси з такою ж парою (якщо унікальність зроблено індексом, а не обмеженням)
drop index if exists article_reads_user_id_content_id_key;
drop index if exists article_reads_user_content_uniq;

-- 3. Новий унікальний ключ
create unique index if not exists article_reads_user_content_date_uniq
  on public.article_reads (user_id, content_id, read_date);

-- 4. Для звітів за період
create index if not exists article_reads_date_idx
  on public.article_reads (read_date);

-- Перевірка після виконання:
--   select count(*) from public.article_reads where read_date is null;   -- має бути 0
--   select indexname from pg_indexes where tablename = 'article_reads';
