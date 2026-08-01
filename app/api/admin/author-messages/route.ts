import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/** Журнал звернень авторів для адмінки. */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  try {
    const r = await dbQuery(
      `select id::text, author_id::text, coalesce(author_name, '') as author_name,
              coalesce(email, '') as email, topic, body, created_at
         from author_messages
        order by created_at desc
        limit 500`,
    )
    return NextResponse.json({ ok: true, rows: r.rows })
  } catch (e) {
    const err = e as { message?: string }
    return NextResponse.json(
      { ok: false, error: `Не вдалося прочитати звернення: ${err?.message ?? ''}` },
      { status: 500 },
    )
  }
}
