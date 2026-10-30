import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { runContestReview, reviewHash, REVIEW_MODEL, type EntryInput } from '@/lib/contest-ai-review'
import { countWords } from '@/lib/contests'

/**
 * Оцінка конкурсних творів ШІ: /api/admin/contest-ai-review
 *
 * GET               — усі конкурсні заявки з останньою оцінкою ШІ (бал, дата);
 * GET ?entry=<id>   — остання оцінка однієї заявки (повний результат);
 * POST { entryId, force? } — оцінити. Якщо той самий текст уже оцінювали,
 *                   повертає збережене (крім force), щоб не платити двічі.
 *
 * Лише для адміна. Кабінет редактора (/editor) цю таблицю НЕ читає — оцінка
 * ШІ паралельна й незалежна, редактори її не бачать.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const entry = req.nextUrl.searchParams.get('entry')
  try {
    if (entry) {
      const r = await dbQuery(
        `select id::text, entry_id, total, words, model, result, created_at
           from contest_ai_reviews where entry_id = $1 order by created_at desc limit 1`,
        [entry],
      )
      return NextResponse.json({ ok: true, review: r.rows[0] ?? null })
    }
    const r = await dbQuery(
      `select e.id::text, e.contest, e.title, e.status, e.created_at,
              count(ep.id)::int as episodes, coalesce(sum(ep.words), 0)::int as words,
              (select total from contest_ai_reviews a where a.entry_id = e.id::text order by created_at desc limit 1) as ai_total,
              (select created_at from contest_ai_reviews a where a.entry_id = e.id::text order by created_at desc limit 1) as ai_at,
              (select (result->>'index')::int from ai_style_checks s where s.source = 'contest' and s.source_id = e.id::text order by created_at desc limit 1) as style_index,
              (select created_at from ai_style_checks s where s.source = 'contest' and s.source_id = e.id::text order by created_at desc limit 1) as style_at,
              (select verdict from contest_originality_checks o where o.entry_id = e.id::text order by created_at desc limit 1) as orig_verdict,
              (select jsonb_array_length(result->'matches') from contest_originality_checks o where o.entry_id = e.id::text order by created_at desc limit 1) as orig_matches
         from contest_entries e
         left join contest_episodes ep on ep.entry_id = e.id
        group by e.id
        order by e.created_at desc`,
    )
    return NextResponse.json({ ok: true, entries: r.rows })
  } catch (err) {
    console.error('[contest-ai-review GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Помилка бази. Чи створено таблицю contest_ai_reviews?' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let b: { entryId?: string; force?: boolean }
  try { b = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }
  const entryId = String(b.entryId ?? '').trim()
  if (!entryId) return NextResponse.json({ ok: false, error: 'Не вказано заявку' }, { status: 400 })

  let input: EntryInput
  try {
    const e = await dbQuery(`select contest, title, annotation, synopsis, genre from contest_entries where id::text = $1`, [entryId])
    const row = e.rows[0] as { contest: string; title: string; annotation: string | null; synopsis: string | null; genre: string | null } | undefined
    if (!row) return NextResponse.json({ ok: false, error: 'Заявку не знайдено' }, { status: 404 })
    const eps = await dbQuery(`select ord, body from contest_episodes where entry_id::text = $1 order by ord`, [entryId])
    input = {
      contest: row.contest, title: row.title ?? '', annotation: row.annotation ?? '', synopsis: row.synopsis ?? '', genre: row.genre ?? '',
      episodes: (eps.rows as { ord: number; body: string }[]).map((x) => ({ ord: x.ord, body: x.body ?? '' })),
    }
  } catch (err) {
    console.error('[contest-ai-review load]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося прочитати заявку' }, { status: 500 })
  }
  if (!input.episodes.length) return NextResponse.json({ ok: false, error: 'У заявці немає тексту' }, { status: 400 })

  const hash = reviewHash(input)
  const words = input.episodes.reduce((a, x) => a + countWords(x.body), 0)
  try {
    if (!b.force) {
      const c = await dbQuery(
        `select id::text, entry_id, total, words, model, result, created_at
           from contest_ai_reviews where entry_id = $1 and text_hash = $2 order by created_at desc limit 1`,
        [entryId, hash],
      )
      if (c.rows[0]) return NextResponse.json({ ok: true, cached: true, review: c.rows[0] })
    }
    const result = await runContestReview(input)
    const ins = await dbQuery(
      `insert into contest_ai_reviews (entry_id, contest, text_hash, words, total, model, result)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id::text, entry_id, total, words, model, result, created_at`,
      [entryId, input.contest, hash, words, result.total, REVIEW_MODEL, JSON.stringify(result)],
    )
    return NextResponse.json({ ok: true, cached: false, review: ins.rows[0] })
  } catch (err) {
    console.error('[contest-ai-review run]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Оцінка не вдалася: ${(err as Error)?.message ?? ''}` }, { status: 502 })
  }
}
