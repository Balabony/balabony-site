import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Публікація твору самим автором: /api/author/publish
 *
 * Натискання кнопки і є згодою на публікацію. Тому спершу пишемо факт
 * згоди в publish_consents — з часом, IP і user-agent — і лише потім
 * міняємо статус. Порядок саме такий: якщо друга операція впаде, у нас
 * лишиться слід наміру, а не опублікований твір без підстави.
 *
 * Право перевіряємо щоразу за content.author_id: без цього будь-хто з
 * кабінетом опублікував би чужий твір, знаючи лише його id.
 *
 * Публікуємо тільки з draft. Твір на редактурі чи в обробці автор не
 * проштовхує повз редакцію — інакше кнопка стала б обхідним шляхом.
 */

const PUBLISHABLE = ['draft']

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
    }

    let payload: { contentId?: string; consent?: boolean }
    try {
      payload = (await req.json()) as typeof payload
    } catch {
      return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
    }

    const contentId = String(payload.contentId ?? '').trim()
    if (!contentId) {
      return NextResponse.json({ ok: false, error: 'Не вказано твір' }, { status: 400 })
    }

    if (payload.consent !== true) {
      return NextResponse.json(
        { ok: false, error: 'Підтвердіть згоду на публікацію' },
        { status: 400 },
      )
    }

    const admin = getSupabaseAdmin()

    const { data: row, error: readErr } = await admin
      .from('content')
      .select('id, author_id, status, title')
      .eq('id', contentId)
      .maybeSingle()

    if (readErr || !row) {
      return NextResponse.json({ ok: false, error: 'Твір не знайдено' }, { status: 404 })
    }

    if (row.author_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'Це не ваш твір' }, { status: 403 })
    }

    if (!PUBLISHABLE.includes(String(row.status))) {
      return NextResponse.json(
        { ok: false, error: 'Цей твір уже в роботі редакції' },
        { status: 400 },
      )
    }

    // Слід згоди — першим.
    const { error: consentErr } = await admin
      .from('publish_consents')
      .upsert(
        {
          content_id: contentId,
          author_id: user.id,
          ip: getIP(req),
          user_agent: (req.headers.get('user-agent') ?? '').slice(0, 500),
        },
        { onConflict: 'content_id' },
      )

    if (consentErr) {
      return NextResponse.json(
        { ok: false, error: 'Не вдалося зафіксувати згоду' },
        { status: 500 },
      )
    }

    const { error: updErr } = await admin
      .from('content')
      .update({ status: 'published' })
      .eq('id', contentId)
      .eq('author_id', user.id)

    if (updErr) {
      return NextResponse.json(
        { ok: false, error: 'Згоду збережено, але статус не змінився' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, status: 'published' })
  } catch {
    return NextResponse.json({ ok: false, error: 'Помилка сервера' }, { status: 500 })
  }
}
