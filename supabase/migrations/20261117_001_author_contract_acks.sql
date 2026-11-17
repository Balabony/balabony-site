-- 17.11.2026: облік згоди авторів із редакцією договору (v8.8, п. 8.11 про ШІ).
create table if not exists public.author_contract_acks (
  user_id uuid not null,
  revision text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, revision)
);
-- Доступ лише через сервер (pg Pool), публічний REST закритий.
alter table public.author_contract_acks enable row level security;
