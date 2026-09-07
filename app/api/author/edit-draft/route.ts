import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Редагування власного твору автором: /api/author/edit-draft
 *
 * Тільки чернетки. Опублікований твір автор не переписує: зміна заголовка
 * тягне зміну slug, а це вже перенаправлення й пошукові наслідки. Тому
 * PUBLISHABLE тут той самий список, що й у /api/author/publish — правити
 * можна рівно те, що автор ще може опублікувати.
 *
 * Право перевіряємо щоразу за content.author_id, як і в publish: без цього
 * будь-хто з кабінетом переписав би чужий твір, знаючи лише його id.
 *
 * slug не чіпаємо навіть для чернетки. Він міг бути виданий при імпорті і
 * вже стояти в чиємусь листі; заголовок і посилання розходяться безболісно.
 */

const EDITABLE = ['draft']

const TITLE_MAX = 200
const TEXT_MIN = 200

type Body = {
  contentId?: string
  title?: string
  text?: string
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
    }

    const contentId = String(req.nextUrl.searchParams.get('contentId') ?? '').trim()
    if (!contentId) {
      return NextResponse.json({ ok: false, error: 'Не вказано твір' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    const { data: row, error } = await admin
      .from('content')
      .select('id, author_id, status, title, text')
      .eq('id', contentId)
      .maybeSingle()

    if (error || !row) {
      return NextResponse.json({ ok: false, error: 'Твір не знайдено' }, { status: 404 })
    }

    if (row.author_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'Це не ваш твір' }, { status: 403 })
    }

    if (!EDITABLE.includes(String(row.status))) {
      return NextResponse.json(
        { ok: false, error: 'Опублікований твір редагує редакція — напишіть нам' },
        { status: 400 },
      )
    }

    return NextResponse.json({
      ok: true,
      title: row.title ?? '',
      text: row.text ?? '',
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Помилка сервера' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
    }

    let b: Body
    try {
      b = (await req.json()) as Body
    } catch {
      return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
    }

    const contentId = String(b.contentId ?? '').trim()
    if (!contentId) {
      return NextResponse.json({ ok: false, error: 'Не вказано твір' }, { status: 400 })
    }

    const hasTitle = typeof b.title === 'string'
    const hasText = typeof b.text === 'string'

    if (!hasTitle && !hasText) {
      return NextResponse.json({ ok: false, error: 'Нема що зберігати' }, { status: 400 })
    }

    const title = hasTitle ? String(b.title).trim() : null
    const text = hasText ? String(b.text).trim() : null

    if (hasTitle) {
      if (!title) {
        return NextResponse.json({ ok: false, error: 'Заголовок не може бути порожній' }, { status: 400 })
      }
      if (title.length > TITLE_MAX) {
        return NextResponse.json(
          { ok: false, error: `Заголовок задовгий — максимум ${TITLE_MAX} знаків` },
          { status: 400 },
        )
      }
    }

    if (hasText && (!text || text.length < TEXT_MIN)) {
      return NextResponse.json(
        { ok: false, error: `Текст закороткий — щонайменше ${TEXT_MIN} знаків` },
        { status: 400 },
      )
    }

    const admin = getSupabaseAdmin()

    const { data: row, error: readErr } = await admin
      .from('content')
      .select('id, author_id, status')
      .eq('id', contentId)
      .maybeSingle()

    if (readErr || !row) {
      return NextResponse.json({ ok: false, error: 'Твір не знайдено' }, { status: 404 })
    }

    if (row.author_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'Це не ваш твір' }, { status: 403 })
    }

    if (!EDITABLE.includes(String(row.status))) {
      return NextResponse.json(
        { ok: false, error: 'Опублікований твір редагує редакція — напишіть нам' },
        { status: 400 },
      )
    }

    const update: Record<string, string> = {}
    if (hasTitle && title) update.title = title
    if (hasText && text) update.text = text

    const { error: updErr } = await admin
      .from('content')
      .update(update)
      .eq('id', contentId)
      .eq('author_id', user.id)

    if (updErr) {
      return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Помилка сервера' }, { status: 500 })
  }
}
