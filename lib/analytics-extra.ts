import { dbQuery } from '@/lib/db'

// 06.11.2026: допоміжні журнали для аналітики — пошук на сайті й запуски аудіо.
// Таблиці створюються самі при першому записі; захищені RLS (пише лише сервер).
let ready = false
export async function ensureAnalyticsTables() {
  if (ready) return
  await dbQuery(`create table if not exists search_log (
    id bigserial primary key, q text not null, results int not null default 0,
    session_id text, created_at timestamptz not null default now())`)
  await dbQuery(`create table if not exists audio_plays (
    id bigserial primary key, content_key text not null, title text,
    session_id text, visitor_id text, created_at timestamptz not null default now())`)
  await dbQuery(`create table if not exists analytics_insights (
    id bigserial primary key, period_days int not null, metrics jsonb not null,
    text text not null, created_at timestamptz not null default now())`)
  await dbQuery(`alter table search_log enable row level security`)
  await dbQuery(`alter table audio_plays enable row level security`)
  await dbQuery(`alter table analytics_insights enable row level security`)
  ready = true
}

export async function logSearch(q: string, results: number, sessionId: string | null) {
  try {
    await ensureAnalyticsTables()
    await dbQuery(`insert into search_log (q, results, session_id) values ($1, $2, $3)`,
      [q.slice(0, 200).toLowerCase(), results, sessionId?.slice(0, 64) ?? null])
  } catch (e) { console.error('[search_log]', (e as Error).message) }
}

export async function logAudioPlay(key: string, title: string | null, sessionId: string | null, visitorId: string | null) {
  try {
    await ensureAnalyticsTables()
    await dbQuery(`insert into audio_plays (content_key, title, session_id, visitor_id) values ($1, $2, $3, $4)`,
      [key.slice(0, 200), title?.slice(0, 300) ?? null, sessionId?.slice(0, 64) ?? null, visitorId?.slice(0, 64) ?? null])
  } catch (e) { console.error('[audio_plays]', (e as Error).message) }
}
