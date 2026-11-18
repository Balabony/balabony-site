import { NextRequest, NextResponse } from 'next/server'
import { getEditorByToken, EDITOR_COOKIE } from '@/lib/editor-auth'
import { decideContent, ContentDecisionError, type ContentDecision } from '@/lib/content-review'

/**
 * Рішення редактора щодо твору, затриманого до перевірки (18.11.2026, рішення Богдана: редактори вирішують самі).
 * POST { contentId, decision: 'publish' | 'return', comment }
 *   publish — опублікувати (коментар за бажанням); return — повернути автору (коментар від 30 символів).
 * Лише свій призначений твір, лише поки рішення не ухвалено. Рішення остаточне, автору одразу лист.
 */

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const editor = await getEditorByToken(req.cookies.get(EDITOR_COOKIE)?.value)
  if (!editor) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let contentId = '', decision = '', comment = ''
  try {
    const b = await req.json() as Record<string, unknown>
    contentId = String(b.contentId ?? '').trim()
    decision = String(b.decision ?? '')
    comment = String(b.comment ?? '').trim().slice(0, 3000)
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }
  if (!/^[0-9a-f-]{32,40}$/i.test(contentId) || !['publish', 'return'].includes(decision)) {
    return NextResponse.json({ ok: false, error: 'Невірні дані' }, { status: 400 })
  }
  if (decision === 'return' && comment.length < 30) {
    return NextResponse.json({ ok: false, error: 'Поясніть автору, що поправити: від 30 символів' }, { status: 400 })
  }
  try {
    const r = await decideContent({ contentId, editorId: editor.id, editorName: editor.name, decision: decision as ContentDecision, comment })
    return NextResponse.json({ ok: true, ...r })
  } catch (err) {
    if (err instanceof ContentDecisionError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status })
    console.error('[editor/content-review]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося ухвалити рішення' }, { status: 500 })
  }
}
