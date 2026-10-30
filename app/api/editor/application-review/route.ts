import { after, NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { getEditorByToken, EDITOR_COOKIE } from '@/lib/editor-auth'
import { ensureReviewTable, mailVerdictToAdmin, VERDICTS, type Verdict } from '@/lib/application-review'

/**
 * Відгук редактора на заявку нового автора (30.10.2026).
 * Лише своя призначена заявка, лише поки рішення не ухвалено. Відгук можна оновити.
 */

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const editor = await getEditorByToken(req.cookies.get(EDITOR_COOKIE)?.value)
  if (!editor) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let appId = '', verdict = '', comment = ''
  try {
    const b = await req.json() as Record<string, unknown>
    appId = String(b.appId ?? '').trim()
    verdict = String(b.verdict ?? '')
    comment = String(b.comment ?? '').trim().slice(0, 3000)
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }
  if (!/^\d+$/.test(appId) || !(verdict in VERDICTS)) {
    return NextResponse.json({ ok: false, error: 'Невірні дані' }, { status: 400 })
  }
  if (comment.length < 30) {
    return NextResponse.json({ ok: false, error: 'Коментар має бути від 30 символів' }, { status: 400 })
  }

  await ensureReviewTable()
  const r = await dbQuery(
    `update application_reviews rv
        set verdict = $3, comment = $4, responded_at = now()
       from author_applications a
      where a.id = rv.application_id and rv.application_id = $1 and rv.editor_id = $2 and a.status = 'new'
      returning a.title`,
    [appId, editor.id, verdict, comment],
  )
  if (!r.rowCount) {
    return NextResponse.json({ ok: false, error: 'Заявку вам не призначено або рішення вже ухвалено' }, { status: 403 })
  }
  const title = (r.rows[0] as { title: string }).title
  after(() => mailVerdictToAdmin({ editor: editor.name, appId, title, verdict: verdict as Verdict, comment }))
  return NextResponse.json({ ok: true })
}
