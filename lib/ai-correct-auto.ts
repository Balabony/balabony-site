import { dbQuery } from '@/lib/db'
import { runCorrection, textHash, type Change } from '@/lib/ai-correct'

/**
 * 15.11.2026 (Богдан): «ШІ робить сам, я лише погоджую правки».
 *
 * Щогодини готуємо ШІ-правки наперед — для тих самих творів, що й у
 * перевірці грамотності (графік публікацій + твори, які автори опублікували
 * самі за 14 днів). Редактор відкриває твір і одразу бачить «ШІ пропонує N
 * правок» — без кнопки й очікування. Текст автора НЕ змінюємо: правки лише
 * пропонуються, застосовує їх редактор.
 *
 * Пропозиція прив'язана до відбитка тексту (text_hash): якщо текст змінили,
 * стару пропозицію не показуємо, і наступного запуску готуємо нову.
 */

const PER_RUN = 4

let ready = false
export async function ensureCorrectionTable() {
  if (ready) return
  await dbQuery(`create table if not exists ai_corrections (
    content_id text primary key,
    text_hash text not null,
    changes jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
  )`)
  ready = true
}

export async function getCorrection(contentId: string): Promise<{ text_hash: string; changes: Change[]; created_at: string } | null> {
  await ensureCorrectionTable()
  const r = await dbQuery(`select text_hash, changes, created_at from ai_corrections where content_id = $1`, [contentId])
  return (r.rows[0] as { text_hash: string; changes: Change[]; created_at: string } | undefined) ?? null
}

export async function autoCorrections(budgetMs = 240_000): Promise<string[]> {
  const started = Date.now()
  await ensureCorrectionTable()
  const r = await dbQuery(
    `select c.id::text as id, c.title, c.genre, c.text
       from content c
      where (c.status::text in ('scheduled', 'approved', 'review')
             or (c.status::text = 'published' and coalesce(c.published_at, c.created_at) > now() - interval '14 days'))
        and coalesce(c.text, '') <> ''
      order by c.publish_at asc nulls last
      limit 60`,
  )
  const done: string[] = []
  for (const row of r.rows as { id: string; title: string; genre: string | null; text: string }[]) {
    if (done.length >= PER_RUN || Date.now() - started > budgetMs - 90_000) break
    const hash = textHash(row.text)
    const prev = await dbQuery(`select 1 from ai_corrections where content_id = $1 and text_hash = $2`, [row.id, hash])
    if (prev.rows.length) continue
    if (row.text.split(/\s+/).filter(Boolean).length < 50) continue
    try {
      const res = await runCorrection(row.text, row.genre ?? undefined)
      await dbQuery(
        `insert into ai_corrections (content_id, text_hash, changes) values ($1, $2, $3)
         on conflict (content_id) do update set text_hash = excluded.text_hash, changes = excluded.changes, created_at = now()`,
        [row.id, hash, JSON.stringify(res.changes)],
      )
      done.push(`«${row.title}»: правок ${res.changes.length}`)
    } catch (err) {
      console.error('[ai-correct-auto]', row.id, (err as Error)?.message)
    }
  }
  return done
}
