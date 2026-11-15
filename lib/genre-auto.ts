import { dbQuery } from '@/lib/db'
import { classifyGenre, type GenreRow } from '@/lib/genre-ai'

/**
 * 15.11.2026 (Богдан): жанр має ставити ШІ сам. Автори, що публікують самі,
 * часто лишають жанр порожнім — і картка твору виходила без мітки.
 *
 * Щогодини (разом із перевіркою грамотності, cron grammar-auto) беремо до
 * AUTO_LIMIT творів без жанру й питаємо модель (lib/genre-ai.ts, той самий
 * перелік і ті самі правила, що на екрані «Жанри»).
 *  - впевненість ≥ SURE (70) — жанр записується одразу;
 *  - менше — жанр НЕ ставимо, твір лишається на екрані «Жанри» для редактора
 *    (там модель помиляється саме на межі двох жанрів).
 * Кожен твір питаємо один раз: відповідь лежить у genre_auto, щоб не платити
 * за той самий сумнівний твір щогодини.
 */

const SURE = 70
const AUTO_LIMIT = 10

let ready = false
async function ensureTable() {
  if (ready) return
  await dbQuery(`create table if not exists genre_auto (
    content_id text primary key,
    genre text,
    confidence int not null default 0,
    why text,
    applied boolean not null default false,
    error text,
    checked_at timestamptz not null default now()
  )`)
  ready = true
}

export async function autoGenres(budgetMs = 60_000): Promise<string[]> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return ['жанри: немає GEMINI_API_KEY']
  const started = Date.now()
  await ensureTable()
  const r = await dbQuery(
    `select c.id::text as id, c.title, c.text, c.corrected_text, c.humanized_text, c.published_version
       from content c
      where coalesce(trim(c.genre), '') = ''
        and c.status::text in ('published', 'scheduled', 'approved', 'review')
        and coalesce(c.text, '') <> ''
        and not exists (select 1 from genre_auto g where g.content_id = c.id::text)
      order by c.created_at desc nulls last
      limit $1`,
    [AUTO_LIMIT],
  )
  const done: string[] = []
  for (const row of r.rows as GenreRow[]) {
    if (Date.now() - started > budgetMs) break
    try {
      const res = await classifyGenre(key, row)
      const apply = Boolean(res.genre) && res.confidence >= SURE
      if (apply) {
        // Лише якщо жанр досі порожній: редактор міг поставити його, поки модель думала.
        await dbQuery(
          `update content set genre = $1 where id::text = $2 and coalesce(trim(genre), '') = ''`,
          [res.genre, row.id],
        )
      }
      await dbQuery(
        `insert into genre_auto (content_id, genre, confidence, why, applied, error)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (content_id) do update set genre = excluded.genre, confidence = excluded.confidence,
           why = excluded.why, applied = excluded.applied, error = excluded.error, checked_at = now()`,
        [row.id, res.genre, res.confidence, res.why, apply, res.error ?? null],
      )
      done.push(`«${row.title ?? ''}»: ${res.genre ?? '—'} ${res.confidence}%${apply ? ' (поставлено)' : ' (редактору)'}`)
    } catch (err) {
      console.error('[genre-auto]', row.id, (err as Error)?.message)
    }
  }
  return done
}
