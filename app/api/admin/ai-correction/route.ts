import { NextRequest, NextResponse } from 'next/server'
import { getCorrection } from '@/lib/ai-correct-auto'
import { textHash } from '@/lib/ai-correct'

/**
 * POST { id, text } — готові ШІ-правки для твору, якщо вони підготовлені саме
 * для цього тексту. Правки, цитат яких уже немає в тексті, відкидаємо.
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, text } = await req.json() as { id?: string; text?: string }
    if (!id || !text) return NextResponse.json({ changes: [] })
    const c = await getCorrection(String(id))
    if (!c || c.text_hash !== textHash(text)) return NextResponse.json({ changes: [] })
    const changes = (Array.isArray(c.changes) ? c.changes : []).filter((x) => x && x.original && text.includes(x.original))
    return NextResponse.json({ changes, created_at: c.created_at })
  } catch (err) {
    return NextResponse.json({ changes: [], error: (err as Error)?.message })
  }
}
