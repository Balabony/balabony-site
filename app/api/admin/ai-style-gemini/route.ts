import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { ensureGeminiTable, geminiForEntry } from '@/lib/ai-style-gemini'

/**
 * Друга думка щодо ознак ШІ — Gemini: /api/admin/ai-style-gemini (логіка — lib/ai-style-gemini.ts).
 * Автоматично те саме робить щогодинний cron /api/cron/contest-style-gemini.
 *
 * GET                 — остання друга думка по кожній заявці (індекс, дата);
 * GET ?entry=<id>     — повний результат для звіту;
 * POST { entryId, force? } — перевірити вручну.
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
  try {
    await ensureGeminiTable()
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
    const out = await geminiForEntry(id, Boolean(b.force))
    if (!out.ok) return NextResponse.json({ ok: false, error: out.error }, { status: out.status })
    return NextResponse.json(out)
  } catch (err) {
    console.error('[ai-style-gemini POST]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Перевірка не вдалася: ${(err as Error)?.message ?? ''}` }, { status: 502 })
  }
}
