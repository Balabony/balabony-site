import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendProblemAlert } from '@/lib/problem-alert'
import { dbQuery } from '@/lib/db'
import { decideApplication, DecisionError } from '@/lib/application-decision'
import { ensureReviewTable, sendApplicationToEditors } from '@/lib/application-review'

/**
 * Заявки авторів для адмінки: /api/admin/author-applications
 *
 * GET            — перелік заявок (без тексту).
 * GET ?id=<id>   — одна заявка з текстом історії.
 * POST {id, action: 'accept' | 'reject' | 'send_editors', note?}
 *   send_editors — 30.10.2026: заявка йде в кабінети редакторів (Оксана, Тетяна), як у конкурсах.
 *
 * «Прийняти» робить за один рух те, що раніше робилося руками:
 *   1. профіль автора (author_profiles) на ТОМУ Ж акаунті, з якого подано
 *      заявку — людина вже увійшла, тож другого акаунта не буде;
 *   2. запис згоди (author_consents, канал 'form') з датою подачі;
 *   3. пробна історія → чернетка в content (далі звичайна редактура);
 *   4. лист «кабінет відкрито» з інструкцією входу через /login.
 * «Відхилити» — статус і ввічливий лист, з коментарем, якщо його написали.
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

type Row = {
  id: string
  user_id: string
  email: string
  full_name: string
  pen_name: string | null
  phone: string
  title: string
  genre: string | null
  words: number
  filename: string | null
  status: 'new' | 'accepted' | 'rejected'
  admin_note: string | null
  content_id: string | null
  decided_at: string | null
  created_at: string
  consent_ip: string | null
  answers: Record<string, string> | null
  reviews: { editor: string; verdict: string | null; comment: string | null; at: string | null }[]
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  try {
    if (id) {
      const r = await dbQuery(`select id::text, body from author_applications where id = $1`, [id])
      if (!r.rowCount) return NextResponse.json({ ok: false, error: 'Заявку не знайдено' }, { status: 404 })
      return NextResponse.json({ ok: true, body: (r.rows[0] as { body: string }).body })
    }
    await ensureReviewTable()
    const r = await dbQuery(
      `select id::text, user_id::text, email, full_name, pen_name, phone, title, genre, words,
              filename, status, admin_note, content_id::text, decided_at, created_at, consent_ip, answers,
              (select coalesce(json_agg(json_build_object('editor', ed.name, 'verdict', rv.verdict,
                                                         'comment', rv.comment, 'at', rv.responded_at)
                                        order by ed.name), '[]'::json)
                 from application_reviews rv join editors ed on ed.id = rv.editor_id
                where rv.application_id = author_applications.id) as reviews
         from author_applications
        order by (status = 'new') desc, created_at desc
        limit 300`,
    )
    return NextResponse.json({ ok: true, applications: r.rows as Row[] })
  } catch (err) {
    console.error('[admin/author-applications GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'db error' }, { status: 500 })
  }
}

async function handlePOST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let id = '', action = '', note = ''
  try {
    const b = await req.json()
    id = String(b?.id ?? '')
    action = String(b?.action ?? '')
    note = String(b?.note ?? '').trim().slice(0, 2000)
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }
  if (!id || !['accept', 'reject', 'send_editors'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'Потрібні id і дія' }, { status: 400 })
  }

  if (action === 'send_editors') {
    try {
      const r = await sendApplicationToEditors(id)
      return NextResponse.json({ ok: true, ...r })
    } catch (err) {
      return NextResponse.json({ ok: false, error: `Не вдалося надіслати: ${(err as Error)?.message ?? ''}` }, { status: 500 })
    }
  }

  try {
    const d = await decideApplication(id, action as 'accept' | 'reject', note, { reconsider: true })
    return NextResponse.json({ ok: true, ...d })
  } catch (err) {
    if (err instanceof DecisionError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status })
    console.error('[admin/author-applications POST]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: `Не вдалося виконати дію: ${(err as Error)?.message ?? ''}` }, { status: 500 })
  }
}

// 14.10.2026: помилка дії в адмінці (прийняти/відхилити) — лист Богдану.
export async function POST(req: NextRequest) {
  const res = await handlePOST(req)
  if (res.status >= 500) {
    let error = `HTTP ${res.status}`
    try { const j = await res.clone().json() as { error?: string }; if (j?.error) error = j.error } catch { /* */ }
    after(() => sendProblemAlert({ where: 'адмінка: заявки авторів', error }))
  }
  return res
}
