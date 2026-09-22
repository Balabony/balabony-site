import { NextRequest, NextResponse } from 'next/server'
import { runHumanize, MAX_HUMANIZE_CHARS } from '@/lib/ai-humanize'
import { toPlainText } from '@/lib/plain-text'

/**
 * Олюднення власних текстів редакції: /api/admin/humanize
 * POST { text, title?, kind?, notes? } → { ok, text, changes, placeholders }
 * Лише вставлений текст — без номерів заявок і творів (межа п. 8.11, див. lib/ai-humanize.ts).
 * Результат у базі не зберігаємо: редактор копіює його сам.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let b: { text?: string; title?: string; kind?: string; notes?: string }
  try { b = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }

  const text = toPlainText(String(b.text ?? '')).trim()
  const words = text.split(/\s+/).filter(Boolean).length
  if (words < 80) return NextResponse.json({ ok: false, error: `Замало тексту: ${words} слів (потрібно від 80)` }, { status: 400 })
  if (text.length > MAX_HUMANIZE_CHARS) {
    return NextResponse.json({ ok: false, error: `Задовгий текст: ${text.length} знаків (до ${MAX_HUMANIZE_CHARS}). Розбийте на частини.` }, { status: 400 })
  }
  try {
    const r = await runHumanize({
      text,
      title: String(b.title ?? '').trim().slice(0, 200),
      kind: String(b.kind ?? '').trim().slice(0, 60),
      notes: String(b.notes ?? '').trim().slice(0, 6000),
    })
    return NextResponse.json({ ok: true, ...r })
  } catch (err) {
    console.error('[humanize]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Не вдалося: ${(err as Error)?.message ?? ''}` }, { status: 502 })
  }
}
