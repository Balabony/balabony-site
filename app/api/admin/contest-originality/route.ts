import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { checkEntryOriginality } from '@/lib/contest-originality-run'

/**
 * Чи не публікувався конкурсний твір в інших онлайн-медіа.
 * GET ?entry=<id>          — остання перевірка;
 * POST { entryId, force? } — перевірити (вебпошук характерних фраз).
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
  const entry = req.nextUrl.searchParams.get('entry') ?? ''
  try {
    const r = await dbQuery(
      `select id::text, entry_id, verdict, result, created_at from contest_originality_checks
        where entry_id = $1 order by created_at desc limit 1`,
      [entry],
    )
    return NextResponse.json({ ok: true, check: r.rows[0] ?? null })
  } catch (err) {
    console.error('[contest-originality GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Помилка бази. Чи створено таблицю contest_originality_checks?' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let b: { entryId?: string; force?: boolean }
  try { b = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }
  const entryId = String(b.entryId ?? '').trim()
  if (!entryId) return NextResponse.json({ ok: false, error: 'Не вказано заявку' }, { status: 400 })
  try {
    const r = await checkEntryOriginality(entryId, Boolean(b.force))
    return NextResponse.json({ ok: true, ...r })
  } catch (err) {
    console.error('[contest-originality POST]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Перевірка не вдалася: ${(err as Error)?.message ?? ''}` }, { status: 502 })
  }
}
