-- Migration: 20260624_002_canon_audit
-- Purpose: Кімната сценариста, Ф2c. Зберігає результат пакетного AI-continuity
--   реаудиту корпусу. Один рядок на епізод (апсерт за episode_id). Лічильники
--   (cont_errors/warns/voice_issues) — для сортування й CSV-огляду; повний
--   результат — у findings (jsonb). Реаудит перезаписує рядки заново.
--
-- RLS: увімкнено без політик → лише service_role (адмін-ендпойнт).

CREATE TABLE IF NOT EXISTS public.canon_audit (
  episode_id   uuid        PRIMARY KEY REFERENCES public.content(id) ON DELETE CASCADE,
  season       integer     NULL,
  episode      integer     NULL,
  title        text        NULL,
  prev_count   integer     NOT NULL DEFAULT 0,
  cont_errors  integer     NOT NULL DEFAULT 0,
  cont_warns   integer     NOT NULL DEFAULT 0,
  voice_issues integer     NOT NULL DEFAULT 0,
  summary      text        NULL,
  findings     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  checked_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.canon_audit IS
  'Результат пакетного AI-continuity реаудиту (Кімната сценариста, Ф2c). Один рядок на епізод. Доступ лише через service_role.';

CREATE INDEX IF NOT EXISTS idx_canon_audit_errors ON public.canon_audit (cont_errors DESC, cont_warns DESC);

ALTER TABLE public.canon_audit ENABLE ROW LEVEL SECURITY;
-- Політик немає навмисно: читання/запис лише через адмін-ендпойнт (service_role).
