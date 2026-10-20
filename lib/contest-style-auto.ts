import { dbQuery } from '@/lib/db'
import { runStyleCheck, textHash, STYLE_MODEL } from '@/lib/ai-style-check'

/**
 * Автоматична перевірка «ознак ШІ» для кожної конкурсної роботи (21.10.2026).
 *
 * Раніше перевірку запускали вручну на /admin/shi-perevirka, тож частина робіт
 * мала лише оцінку рецензента, а «ознак ШІ» не мала зовсім — і на сторінці
 * «Оцінки конкурсів» це плутали. Тепер щогодини cron бере роботи без перевірки
 * (крім відхилених) і перевіряє їх по одній, доки є час.
 *
 * Якщо той самий текст уже перевіряли (наприклад, як твір із content), модель
 * не викликаємо — копіюємо результат під конкурсну заявку. Платимо раз за текст.
 */

type Entry = { id: string; title: string; genre: string | null }

export async function autoStyleChecks(budgetMs = 200_000): Promise<string[]> {
  const started = Date.now()
  const done: string[] = []
  const r = await dbQuery(
    `select e.id::text as id, e.title, e.genre
       from contest_entries e
      where e.status <> 'rejected'
        and exists (select 1 from contest_episodes ep where ep.entry_id = e.id)
        and not exists (select 1 from ai_style_checks s where s.source = 'contest' and s.source_id = e.id::text)
      order by e.created_at
      limit 10`,
  )
  for (const e of r.rows as Entry[]) {
    // Одна перевірка може тривати до ~2 хв — не починаємо нову, якщо часу мало.
    if (Date.now() - started > budgetMs - 120_000 && done.length > 0) break
    try {
      const eps = await dbQuery(`select body from contest_episodes where entry_id::text = $1 order by ord`, [e.id])
      const text = (eps.rows as { body: string }[]).map((x) => x.body).join('\n\n')
      const words = text.split(/\s+/).filter(Boolean).length
      if (words < 150) continue
      const hash = textHash(text, null)
      const prev = await dbQuery(`select stats, result, model, words from ai_style_checks where text_hash = $1 order by created_at desc limit 1`, [hash])
      if (prev.rows[0]) {
        const p = prev.rows[0] as { stats: unknown; result: unknown; model: string; words: number }
        await dbQuery(
          `insert into ai_style_checks (source, source_id, title, text_hash, words, stats, result, model)
           values ('contest', $1, $2, $3, $4, $5, $6, $7)`,
          [e.id, e.title, hash, p.words, JSON.stringify(p.stats), JSON.stringify(p.result), p.model],
        )
        done.push(`«${e.title}» (з кешу)`)
        continue
      }
      const { stats, result } = await runStyleCheck({ title: e.title, genre: e.genre ?? '', text, answers: null })
      await dbQuery(
        `insert into ai_style_checks (source, source_id, title, text_hash, words, stats, result, model)
         values ('contest', $1, $2, $3, $4, $5, $6, $7)`,
        [e.id, e.title, hash, stats.words, JSON.stringify(stats), JSON.stringify(result), STYLE_MODEL],
      )
      done.push(`«${e.title}»: ознаки ШІ ${result.index ?? '?'}/100`)
    } catch (err) {
      console.error('[contest-style-auto]', e.id, (err as Error)?.message)
    }
  }
  return done
}
