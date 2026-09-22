import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { runStyleCheck, textHash, STYLE_MODEL } from '@/lib/ai-style-check'
import { toPlainText } from '@/lib/plain-text'
import type { Answers } from '@/lib/author-questions'

/**
 * Визначальник стилю: /api/admin/ai-style-check
 *
 * POST { source: 'application'|'contest'|'content'|'manual', id?, text?, title?, genre?, force? }
 *   — бере текст із заявки автора, конкурсної заявки (усі серії підряд),
 *     твору з content або вставлений вручну; повертає збережений результат,
 *     якщо той самий текст уже перевіряли (крім force).
 * GET ?check=<id>            — одна перевірка;
 * GET ?source=…&id=…         — остання перевірка джерела;
 * GET                        — історія (останні 60).
 * DELETE ?check=<id>         — видалити одну перевірку з історії.
 *
 * ТИМЧАСОВІ ПЕРЕВІРКИ «ОЛЮДНЕННЯ» (рішення 22.09.2026): перевірки, які запускає
 * /admin/oliudnennia (source = 'manual', source_id = 'oliudnennia'), в історії не
 * показуються й видаляються через 10 хвилин. Окремого cron немає: прибирання
 * відбувається при кожному зверненні до цього API. Нове значення source не
 * заводимо, бо в таблиці стоїть check (source in …) — довелося б міняти базу.
 * Перевірки творів авторів НЕ видаляються автоматично: вони — підстава для
 * процедури п. 8.11 і кеш, щоб не платити за той самий текст удруге.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

const SOURCES = ['application', 'contest', 'content', 'manual'] as const
type Source = typeof SOURCES[number]
const TEMP_TAG = 'oliudnennia'

async function purgeTemp() {
  try {
    await dbQuery(`delete from ai_style_checks where source = 'manual' and source_id = $1 and created_at < now() - interval '10 minutes'`, [TEMP_TAG])
  } catch (err) {
    console.error('[ai-style-check purge]', (err as Error)?.message)
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await purgeTemp()
  const q = req.nextUrl.searchParams
  try {
    if (q.get('check')) {
      const r = await dbQuery(`select * from ai_style_checks where id = $1`, [q.get('check')])
      return NextResponse.json({ ok: true, check: r.rows[0] ?? null })
    }
    if (q.get('source') && q.get('id')) {
      const r = await dbQuery(
        `select * from ai_style_checks where source = $1 and source_id = $2 order by created_at desc limit 1`,
        [q.get('source'), q.get('id')],
      )
      return NextResponse.json({ ok: true, check: r.rows[0] ?? null })
    }
    const r = await dbQuery(
      `select id, source, source_id, title, words, result->>'level' as level,
              result->>'recommendation' as recommendation, result->>'index' as idx,
              result->>'stage' as stage, result->'markers' as markers, created_at
         from ai_style_checks where not (source = 'manual' and coalesce(source_id, '') = $1)
         order by created_at desc limit 60`,
      [TEMP_TAG],
    )
    return NextResponse.json({ ok: true, history: r.rows })
  } catch (err) {
    console.error('[ai-style-check GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'db error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let b: { source?: string; id?: string; text?: string; title?: string; genre?: string; force?: boolean; answersText?: string }
  try { b = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }

  await purgeTemp()
  const source = String(b.source ?? '') as Source
  if (!SOURCES.includes(source)) return NextResponse.json({ ok: false, error: 'Невідоме джерело' }, { status: 400 })
  // Для вставленого тексту номера немає; єдина дозволена позначка — тимчасова перевірка «Олюднення».
  const id = source === 'manual' ? (String(b.id ?? '').trim() === TEMP_TAG ? TEMP_TAG : '') : String(b.id ?? '').trim()

  let title = String(b.title ?? '').trim().slice(0, 200)
  let genre = String(b.genre ?? '').trim().slice(0, 100)
  let text = ''
  let answers: Answers | null = null

  try {
    if (source === 'manual') {
      text = toPlainText(String(b.text ?? ''))
      const at = String(b.answersText ?? '').trim().slice(0, 12000)
      if (at) answers = { manual: at }
    } else if (!id) {
      return NextResponse.json({ ok: false, error: 'Вкажіть номер' }, { status: 400 })
    } else if (source === 'application') {
      const r = await dbQuery(`select title, genre, body, answers from author_applications where id = $1`, [id])
      const row = r.rows[0] as { title: string; genre: string | null; body: string; answers: Answers | null } | undefined
      if (!row) return NextResponse.json({ ok: false, error: 'Заявку не знайдено' }, { status: 404 })
      title = row.title; genre = row.genre ?? ''; text = row.body; answers = row.answers
    } else if (source === 'contest') {
      const e = await dbQuery(`select title, genre from contest_entries where id = $1`, [id])
      const row = e.rows[0] as { title: string; genre: string | null } | undefined
      if (!row) return NextResponse.json({ ok: false, error: 'Конкурсну заявку не знайдено' }, { status: 404 })
      const eps = await dbQuery(`select ord, body from contest_episodes where entry_id = $1 order by ord`, [id])
      title = row.title; genre = row.genre ?? ''
      text = (eps.rows as { ord: number; body: string }[]).map((x) => x.body).join('\n\n')
    } else if (source === 'content') {
      const r = await dbQuery(`select title, genre, text from content where id = $1`, [id])
      const row = r.rows[0] as { title: string; genre: string | null; text: string | null } | undefined
      if (!row) return NextResponse.json({ ok: false, error: 'Твір не знайдено' }, { status: 404 })
      title = row.title; genre = row.genre ?? ''; text = row.text ?? ''
    }
  } catch (err) {
    console.error('[ai-style-check load]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося прочитати текст' }, { status: 500 })
  }

  const words = text.split(/\s+/).filter(Boolean).length
  if (words < 150) return NextResponse.json({ ok: false, error: `Замало тексту для аналізу: ${words} слів (потрібно від 150)` }, { status: 400 })

  const hash = textHash(text, answers)
  try {
    if (!b.force) {
      const c = await dbQuery(`select * from ai_style_checks where text_hash = $1 order by created_at desc limit 1`, [hash])
      if (c.rows[0]) return NextResponse.json({ ok: true, cached: true, check: c.rows[0] })
    }
    const { stats, result } = await runStyleCheck({ title, genre, text, answers })
    const ins = await dbQuery(
      `insert into ai_style_checks (source, source_id, title, text_hash, words, stats, result, model)
       values ($1, nullif($2,''), $3, $4, $5, $6, $7, $8) returning *`,
      [source, id, title, hash, stats.words, JSON.stringify(stats), JSON.stringify(result), STYLE_MODEL],
    )
    return NextResponse.json({ ok: true, cached: false, check: ins.rows[0] })
  } catch (err) {
    console.error('[ai-style-check run]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Перевірка не вдалася: ${(err as Error)?.message ?? ''}` }, { status: 502 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('check')
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ ok: false, error: 'Невірний номер' }, { status: 400 })
  try {
    await dbQuery(`delete from ai_style_checks where id = $1`, [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ai-style-check DELETE]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'db error' }, { status: 500 })
  }
}
