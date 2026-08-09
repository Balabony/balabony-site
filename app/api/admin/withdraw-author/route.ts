import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Зняти з сайту всі твори одного автора.
 *
 * 500 історій із газет опубліковані за згодою, отриманою при виплаті
 * гонорарів. Якщо хтось із авторів усе-таки заперечить, зняття має займати
 * секунди, а не пошук по базі: інакше між листом автора і реакцією мине день,
 * і претензія перетвориться на скаргу.
 *
 * Тексти не видаляємо — повертаємо в чернетки. Автор може передумати, а
 * видалене довелося б заливати заново.
 *
 * Два кроки навмисно: спершу 'count' показує, скільки саме зникне з сайту,
 * і лише потім 'withdraw' виконує. Ім'я автора — рядок, введений руками,
 * тож помилка в літері без попереднього підрахунку лишилась би непоміченою.
 */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

type Body = {
  authorName?: string
  action?: 'count' | 'withdraw'
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 403 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const authorName = (body.authorName ?? '').trim()
  const action = body.action === 'withdraw' ? 'withdraw' : 'count'

  if (authorName.length < 3) {
    return NextResponse.json({ ok: false, error: 'Вкажіть імʼя автора' }, { status: 400 })
  }

  if (action === 'count') {
    const res = await dbQuery(
      `select count(*)::int as n
         from content
        where lower(btrim(author_name)) = lower(btrim($1))
          and status in ('approved', 'published')`,
      [authorName],
    )
    return NextResponse.json({ ok: true, count: res.rows[0]?.n ?? 0 })
  }

  const res = await dbQuery(
    `update content
        set status = 'draft'
      where lower(btrim(author_name)) = lower(btrim($1))
        and status in ('approved', 'published')
      returning id`,
    [authorName],
  )

  return NextResponse.json({ ok: true, withdrawn: res.rows.length })
}
