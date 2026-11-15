import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { runStyleCheckGemini, textHash } from '@/lib/ai-style-check'

/**
 * Друга думка щодо ознак ШІ — Gemini: /api/admin/ai-style-gemini
 * Лише для конкурсних робіт (запускається з /admin/ocinka-shi для тих, де Claude
 * показав значну концентрацію). Окрема таблиця — щоб результати Gemini не
 * підмінили основну перевірку в інших запитах (рейтинг, автоперевірка).
 *
 * GET                 — остання друга думка по кожній заявці (індекс, дата);
 * GET ?entry=<id>     — повний результат для звіту;
 * POST { entryId, force? } — перевірити (той самий текст удруге не платимо, крім force).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

let ready = false
async function ensureTable() {
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

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureTable()
    const entry = req.nextUrl.searchParams.get('entry')
    if (entry) {
      const r = await dbQuery(`select * from ai_style_checks_gemini where source_id = $1 order by created_at desc limit 1`, [entry])
      return NextResponse.json({ ok: true, check: r.rows[0] ?? null })
    }
    const r = await dbQuery(
      `select distinct on (source_id) source_id, (result->>'index')::int as idx, created_at
         from ai_style_checks_gemini order by source_id, created_at desc`,
    )
    return NextResponse.json({ ok: true, rows: r.rows })
  } catch (err) {
    console.error('[ai-style-gemini GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'db error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let b: { entryId?: string; force?: boolean }
  try { b = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }
  const id = String(b.entryId ?? '').trim()
  if (!id) return NextResponse.json({ ok: false, error: 'Вкажіть заявку' }, { status: 400 })

  try {
    await ensureTable()
    const e = await dbQuery(`select title, genre from contest_entries where id = $1`, [id])
    const row = e.rows[0] as { title: string; genre: string | null } | undefined
    if (!row) return NextResponse.json({ ok: false, error: 'Конкурсну заявку не знайдено' }, { status: 404 })
    // Той самий текст, що й в основній перевірці: усі серії заявки підряд.
    const eps = await dbQuery(`select body from contest_episodes where entry_id = $1 order by ord`, [id])
    const text = (eps.rows as { body: string }[]).map((x) => x.body).join('\n\n')
    const words = text.split(/\s+/).filter(Boolean).length
    if (words < 150) return NextResponse.json({ ok: false, error: `Замало тексту: ${words} слів` }, { status: 400 })

    const hash = textHash(text, null)
    if (!b.force) {
      const c = await dbQuery(`select * from ai_style_checks_gemini where text_hash = $1 order by created_at desc limit 1`, [hash])
      if (c.rows[0]) return NextResponse.json({ ok: true, cached: true, check: c.rows[0] })
    }
    const { stats, result, model } = await runStyleCheckGemini({ title: row.title, genre: row.genre ?? '', text, answers: null })
    const ins = await dbQuery(
      `insert into ai_style_checks_gemini (source_id, title, text_hash, words, stats, result, model)
       values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [id, row.title, hash, stats.words, JSON.stringify(stats), JSON.stringify(result), model],
    )
    return NextResponse.json({ ok: true, cached: false, check: ins.rows[0] })
  } catch (err) {
    console.error('[ai-style-gemini POST]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Перевірка не вдалася: ${(err as Error)?.message ?? ''}` }, { status: 502 })
  }
}
