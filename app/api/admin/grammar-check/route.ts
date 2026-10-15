import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { runGrammarCheck } from '@/lib/grammar-check'

/** POST { id } — перевірка граматики й стилістики заявки автора (звіт не зберігається). */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let b: { id?: string }
  try { b = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }
  const id = String(b.id ?? '').trim()
  if (!id) return NextResponse.json({ ok: false, error: 'Вкажіть номер' }, { status: 400 })
  try {
    const r = await dbQuery(`select title, body from author_applications where id = $1`, [id])
    const row = r.rows[0] as { title: string; body: string } | undefined
    if (!row) return NextResponse.json({ ok: false, error: 'Заявку не знайдено' }, { status: 404 })
    if (row.body.split(/\s+/).filter(Boolean).length < 50) return NextResponse.json({ ok: false, error: 'Замало тексту для перевірки' }, { status: 400 })
    const result = await runGrammarCheck(row.title, row.body)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('[grammar-check]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Перевірка не вдалася: ${(err as Error)?.message ?? ''}` }, { status: 502 })
  }
}
