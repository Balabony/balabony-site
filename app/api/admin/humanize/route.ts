import { NextRequest, NextResponse } from 'next/server'
import { runHumanize, MAX_HUMANIZE_CHARS, type HumanizeMarker } from '@/lib/ai-humanize'
import { toPlainText } from '@/lib/plain-text'

/**
 * Олюднення власних текстів редакції: /api/admin/humanize
 * POST { text, title?, kind?, notes?, index?, markers? } → { ok, text, changes, placeholders, mode, warnings }
 * index і markers — з перевірки оригіналу визначальником: задають режим (легкий / точковий / повний).
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
  let b: { text?: string; title?: string; kind?: string; notes?: string; index?: number; markers?: HumanizeMarker[] }
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
      index: typeof b.index === 'number' && b.index >= 0 && b.index <= 100 ? b.index : null,
      markers: Array.isArray(b.markers)
        ? b.markers.slice(0, 10).map((m) => ({
            n: Number(m?.n) || 0, name: String(m?.name ?? '').slice(0, 80), score: Number(m?.score) || 0,
            evidence: Array.isArray(m?.evidence) ? m.evidence.slice(0, 4).map((e) => String(e).slice(0, 300)) : [],
          }))
        : [],
    })
    return NextResponse.json({ ok: true, ...r })
  } catch (err) {
    console.error('[humanize]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Не вдалося: ${(err as Error)?.message ?? ''}` }, { status: 502 })
  }
}
