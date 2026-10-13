import { createHash } from 'crypto'
import { dbQuery } from '@/lib/db'
import { runOriginalityCheck } from '@/lib/contest-originality'

/** Перевіряє заявку на попередню публікацію й зберігає результат. Повторно той самий текст не перевіряє (крім force). */
export async function checkEntryOriginality(entryId: string, force = false) {
  const e = await dbQuery(`select title from contest_entries where id::text = $1`, [entryId])
  const row = e.rows[0] as { title: string } | undefined
  if (!row) throw new Error('Заявку не знайдено')
  const eps = await dbQuery(`select body from contest_episodes where entry_id::text = $1 order by ord`, [entryId])
  const text = (eps.rows as { body: string }[]).map((x) => x.body ?? '').join('\n\n')
  if (!text.trim()) throw new Error('У заявці немає тексту')
  const hash = createHash('sha256').update(text).digest('hex')
  if (!force) {
    const c = await dbQuery(
      `select id::text, entry_id, verdict, result, created_at from contest_originality_checks
        where entry_id = $1 and text_hash = $2 order by created_at desc limit 1`,
      [entryId, hash],
    )
    if (c.rows[0]) return { cached: true, check: c.rows[0] }
  }
  const result = await runOriginalityCheck({ title: row.title ?? '', text })
  const ins = await dbQuery(
    `insert into contest_originality_checks (entry_id, text_hash, verdict, result)
     values ($1, $2, $3, $4) returning id::text, entry_id, verdict, result, created_at`,
    [entryId, hash, result.verdict, JSON.stringify(result)],
  )
  return { cached: false, check: ins.rows[0] }
}
