import { dbQuery } from '@/lib/db'
import { runStyleCheckGemini, textHash } from '@/lib/ai-style-check'

/**
 * Друга думка Gemini щодо ознак ШІ для конкурсних робіт — спільна логіка для
 * адмінки (/api/admin/ai-style-gemini) і щогодинного cron (/api/cron/contest-style-gemini).
 *
 * ПРАВИЛО (16.11.2026, Богдан): поріг сумніву 50/100 для обох моделей, однаковий для всіх.
 * Друга думка — для кожної неввідхиленої роботи, де Claude дав ≥ 50. Лист автору
 * (п. 8.11, 14 днів) — лише коли обидві моделі ≥ 50.
 *
 * Окрема таблиця, щоб результати Gemini не підмінили основну перевірку в інших
 * запитах (рейтинг, автоперевірка Claude), які беруть «останній запис» з ai_style_checks.
 */

export const AI_DOUBT = 50

let ready = false
export async function ensureGeminiTable() {
  if (ready) return
  await dbQuery(`create table if not exists ai_style_checks_gemini (
    id bigserial primary key,
    source text not null default 'contest',
    source_id text not null,
    title text,
    text_hash text not null,
    words int not null default 0,
    stats jsonb,
    result jsonb,
    model text,
    created_at timestamptz not null default now()
  )`)
  ready = true
}

export type GeminiOutcome = { ok: true; cached: boolean; check: Record<string, unknown> } | { ok: false; status: number; error: string }

/** Перевірити одну конкурсну заявку Gemini. Той самий текст удруге не оплачуємо (крім force). */
export async function geminiForEntry(id: string, force = false): Promise<GeminiOutcome> {
  await ensureGeminiTable()
  const e = await dbQuery(`select title, genre from contest_entries where id::text = $1`, [id])
  const row = e.rows[0] as { title: string; genre: string | null } | undefined
  if (!row) return { ok: false, status: 404, error: 'Конкурсну заявку не знайдено' }
  // Той самий текст, що й в основній перевірці: усі серії заявки підряд.
  const eps = await dbQuery(`select body from contest_episodes where entry_id::text = $1 order by ord`, [id])
  const text = (eps.rows as { body: string }[]).map((x) => x.body).join('\n\n')
  const words = text.split(/\s+/).filter(Boolean).length
  if (words < 150) return { ok: false, status: 400, error: `Замало тексту: ${words} слів` }

  const hash = textHash(text, null)
  if (!force) {
    const c = await dbQuery(`select * from ai_style_checks_gemini where text_hash = $1 order by created_at desc limit 1`, [hash])
    if (c.rows[0]) return { ok: true, cached: true, check: c.rows[0] }
  }
  const { stats, result, model } = await runStyleCheckGemini({ title: row.title, genre: row.genre ?? '', text, answers: null })
  const ins = await dbQuery(
    `insert into ai_style_checks_gemini (source_id, title, text_hash, words, stats, result, model)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [id, row.title, hash, stats.words, JSON.stringify(stats), JSON.stringify(result), model],
  )
  return { ok: true, cached: false, check: ins.rows[0] }
}

/**
 * Cron: роботи (крім відхилених), де остання перевірка Claude ≥ AI_DOUBT, а Gemini
 * ще не перевіряла, або перевіряла раніше за останню перевірку Claude (текст могли змінити).
 */
export async function autoGeminiChecks(budgetMs = 240_000): Promise<string[]> {
  const started = Date.now()
  await ensureGeminiTable()
  const r = await dbQuery(
    `with last_claude as (
       select distinct on (source_id) source_id, (result->>'index')::int as idx, created_at
         from ai_style_checks where source = 'contest'
        order by source_id, created_at desc
     ),
     last_gem as (
       select distinct on (source_id) source_id, created_at
         from ai_style_checks_gemini
        order by source_id, created_at desc
     )
     select e.id::text as id, e.title
       from contest_entries e
       join last_claude c on c.source_id = e.id::text
       left join last_gem g on g.source_id = e.id::text
      where e.status <> 'rejected'
        and c.idx >= $1
        and (g.source_id is null or g.created_at < c.created_at)
      order by c.idx desc
      limit 10`,
    [AI_DOUBT],
  )
  const done: string[] = []
  for (const e of r.rows as { id: string; title: string }[]) {
    // Одна перевірка Gemini Pro може тривати 2–3 хв — не починаємо нову, якщо часу мало.
    if (Date.now() - started > budgetMs - 150_000 && done.length > 0) break
    try {
      const out = await geminiForEntry(e.id)
      done.push(out.ok ? `«${e.title}»: Gemini ${(out.check.result as { index?: number })?.index ?? '?'}/100${out.cached ? ' (з кешу)' : ''}` : `«${e.title}»: ${out.error}`)
    } catch (err) {
      console.error('[contest-style-gemini]', e.id, (err as Error)?.message)
    }
  }
  return done
}
