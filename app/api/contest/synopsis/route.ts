import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { findContest, SYNOPSIS_MAX } from '@/lib/contests'

// 31.10.2026: автор додає або змінює синопсис уже поданої заявки — без файлів серій.
// Раніше форма мала лише анотацію до 1500 знаків, і синопсис на сторінку не вміщався
// (лист Таміли Тарасенко, заявка № 12).
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Увійдіть в особистий кабінет' }, { status: 401 })

  let body: { contest?: string; synopsis?: string }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Порожній запит' }, { status: 400 }) }

  const contest = findContest(String(body.contest ?? ''))
  if (!contest?.synopsis) return NextResponse.json({ ok: false, error: 'Цей конкурс не потребує синопсиса' }, { status: 400 })

  const synopsis = String(body.synopsis ?? '').trim()
  if (synopsis.length < 300) {
    return NextResponse.json({ ok: false, error: 'Синопсис закороткий: опишіть сюжет усього серіалу, від початку до розв’язки (орієнтовно одна сторінка).' }, { status: 400 })
  }
  if (synopsis.length > SYNOPSIS_MAX) {
    return NextResponse.json({ ok: false, error: `Синопсис задовгий: до ${SYNOPSIS_MAX} знаків (одна сторінка).` }, { status: 400 })
  }

  try {
    const r = await dbQuery(
      `update contest_entries set synopsis = $3, updated_at = now()
        where author_id = $1 and contest = $2
        returning id::text`,
      [user.id, contest.id, synopsis],
    )
    if (!r.rowCount) return NextResponse.json({ ok: false, error: 'Заявку не знайдено. Спершу подайте назву і першу серію.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contest/synopsis]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти синопсис. Спробуйте ще раз.' }, { status: 500 })
  }
}
