-- 16.11.2026: дата, до якої фільм у прокаті; після неї картка зникає з /afisha.
alter table public.afisha_items add column if not exists until date;
