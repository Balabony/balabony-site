import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Прив'язка історій до авторського профілю.
 *
 * Історії з архіву лягають з author_name, але порожнім author_id — тому
 * автор не бачить їх у кабінеті. Тут адмін вручну зіставляє ім'я з профілем.
 *
 * Автоматичного зіставлення за іменем свідомо немає: інакше будь-хто,
 * зареєструвавшись під чужим іменем, забрав би чужі тексти й гонорари.
 *
 * Прив'язуються лише рядки з порожнім author_id — уже прив'язане не чіпається.
 * Один профіль можна прив'язати до кількох імен (псевдоніми).
 */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

type NameRow = { author_name: string; stories: string }
type ProfileRow = {
  user_id: string
  display_name: string | null
  pen_name: string | null
  email: string | null
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  const names = await dbQuery(
    `select author_name, count(*)::text as stories
       from content
      where author_id is null
        and author_name is not null
        and btrim(author_name) <> ''
      group by author_name
      order by count(*) desc, author_name`,
    []
  )

  const profiles = await dbQuery(
    `select user_id::text as user_id, display_name, pen_name, email
       from author_profiles
      where is_active is true
      order by display_name nulls last`,
    []
  )

  return NextResponse.json({
    ok: true,
    names: (names.rows ?? []) as NameRow[],
    profiles: (profiles.rows ?? []) as ProfileRow[],
  })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  let body: { author_name?: string; user_id?: string }
  try {
    body = (await req.json()) as { author_name?: string; user_id?: string }
  } catch {
    return NextResponse.json({ ok: false, error: 'Не читається запит' }, { status: 400 })
  }

  const authorName = (body.author_name ?? '').trim()
  const userId = (body.user_id ?? '').trim()

  if (!authorName || !userId) {
    return NextResponse.json(
      { ok: false, error: 'Оберіть ім’я та профіль' },
      { status: 400 }
    )
  }

  const prof = await dbQuery(
    `select user_id from author_profiles where user_id = $1::uuid limit 1`,
    [userId]
  )
  if (!prof.rowCount) {
    return NextResponse.json({ ok: false, error: 'Такого профілю немає' }, { status: 404 })
  }

  const upd = await dbQuery(
    `update content
        set author_id = $1::uuid
      where author_name = $2
        and author_id is null`,
    [userId, authorName]
  )

  return NextResponse.json({ ok: true, linked: upd.rowCount ?? 0 })
}
