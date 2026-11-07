import { dbQuery } from '@/lib/db'
import { runGrammarCheck, type GrammarResult } from '@/lib/grammar-check'

/**
 * 05.11.2026 (Богдан): редактори не встигають — перед тим як робота потрапить до редактора,
 * ШІ сам перевіряє грамотність (орфографія, пунктуація, русизми, стиль). Редактор бачить
 * готовий звіт на сторінці роботи й не шукає дрібні помилки сам. Текст не змінюємо.
 * Джерела: конкурсні роботи (нові або вже призначені редакторам) і заявки нових авторів.
 */

let ready = false
export async function ensureGrammarTable() {
  if (ready) return
  await dbQuery(`create table if not exists grammar_checks (
    id bigserial primary key,
    source text not null,
    source_id text not null,
    title text,
    result jsonb not null,
    created_at timestamptz not null default now(),
    unique (source, source_id)
  )`)
  await dbQuery(`alter table grammar_checks enable row level security`)
  ready = true
}

export async function getGrammar(source: 'contest' | 'application', id: string): Promise<GrammarResult | null> {
  try {
    await ensureGrammarTable()
    const r = await dbQuery(`select result from grammar_checks where source = $1 and source_id = $2 limit 1`, [source, id])
    return (r.rows[0] as { result: GrammarResult } | undefined)?.result ?? null
  } catch { return null }
}

type Job = { source: 'contest' | 'application'; id: string; title: string }

export async function autoGrammarChecks(budgetMs = 240_000): Promise<string[]> {
  const started = Date.now()
  await ensureGrammarTable()
  const r = await dbQuery(
    `(select 'contest' as source, e.id::text as id, e.title, e.created_at
        from contest_entries e
       -- 07.11.2026 (Богдан): перевіряємо всі невідхилені конкурсні роботи, зокрема вже прийняті казки
       where e.status <> 'rejected'
         and exists (select 1 from contest_episodes ep where ep.entry_id = e.id)
         and not exists (select 1 from grammar_checks g where g.source = 'contest' and g.source_id = e.id::text))
     union all
     (select 'application', a.id::text, a.title, a.created_at
        from author_applications a
       where a.status = 'new'
         and not exists (select 1 from grammar_checks g where g.source = 'application' and g.source_id = a.id::text))
     order by created_at desc
     limit 6`,
  )
  const done: string[] = []
  for (const j of r.rows as Job[]) {
    if (Date.now() - started > budgetMs - 100_000 && done.length > 0) break
    try {
      let text = ''
      if (j.source === 'contest') {
        const eps = await dbQuery(`select body from contest_episodes where entry_id::text = $1 order by ord`, [j.id])
        text = (eps.rows as { body: string }[]).map((x) => x.body).join('\n\n')
      } else {
        const a = await dbQuery(`select body from author_applications where id::text = $1`, [j.id])
        text = (a.rows[0] as { body: string } | undefined)?.body ?? ''
      }
      if (text.split(/\s+/).filter(Boolean).length < 50) continue
      const res = await runGrammarCheck(j.title, text)
      await dbQuery(
        `insert into grammar_checks (source, source_id, title, result) values ($1, $2, $3, $4)
         on conflict (source, source_id) do update set result = excluded.result, created_at = now()`,
        [j.source, j.id, j.title, JSON.stringify(res)],
      )
      done.push(`«${j.title}»: ${res.level}, зауважень ${res.issues.length}`)
    } catch (err) {
      console.error('[grammar-auto]', j.source, j.id, (err as Error)?.message)
    }
  }
  return done
}
