import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Згода автора на листи редакції.
 *
 * Зберігаємо саме ВІДМОВУ (opt_out), а не згоду: за замовчуванням false, тож
 * наявні автори нічого не втрачають, а відписка — це явна дія людини з датою.
 * Дату тримаємо окремо: якщо колись спитають, коли саме людина відписалась,
 * відповідь має бути в базі, а не в пошті.
 */

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let optOut: boolean
  try {
    const b = (await req.json()) as { optOut?: unknown }
    if (typeof b.optOut !== 'boolean') {
      return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
    }
    optOut = b.optOut
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const r = await dbQuery(
    `update author_profiles
        set newsletter_opt_out = $2,
            newsletter_updated_at = now()
      where user_id = $1
      returning user_id`,
    [user.id, optOut],
  )

  if (r.rowCount === 0) {
    return NextResponse.json({ ok: false, error: 'Авторський профіль не знайдено' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, optOut })
}
