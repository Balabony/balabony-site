import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Черга серій, які автори надіслали на редактуру.
 * Автор ставить content.status = 'review' у своєму кабінеті й далі не втручається.
 * Редактор або публікує, або повертає в чернетку з поміткою.
 */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })

  const r = await dbQuery(
    `select id, title, slug, type, publish_at, description, recap, next_teaser, social_post
       from content
      where status = 'review'
      order by publish_at nulls last, title`,
  )
  return NextResponse.json({ ok: true, items: r.rows })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })

  let b: { id?: string; action?: string }
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const id = (b.id ?? '').trim()
  if (!id) return NextResponse.json({ ok: false, error: 'Не вказано серію' }, { status: 400 })

  const next = b.action === 'publish' ? 'published' : b.action === 'return' ? 'draft' : null
  if (!next) return NextResponse.json({ ok: false, error: 'Невідома дія' }, { status: 400 })

  const r = await dbQuery(
    `update content set status = $1 where id = $2 and status = 'review' returning id`,
    [next, id],
  )
  if (r.rowCount === 0) {
    return NextResponse.json({ ok: false, error: 'Серія вже не на редактурі' }, { status: 409 })
  }

  return NextResponse.json({ ok: true, status: next })
}
