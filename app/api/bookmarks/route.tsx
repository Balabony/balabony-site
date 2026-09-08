import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getOrCreateAnonUserId } from '@/lib/anon-user'
import { dbQuery } from '@/lib/db'

/**
 * Закладки читача: «зберегти, щоб повернутися».
 *
 * Відрізняються від позиції читання (reading_progress) наміром: позиція
 * пишеться сама, коли людина гортає, а закладку читач ставить свідомо.
 * Тому й таблиця окрема — недочитане й збережене це різні списки.
 *
 * Для залогінених ключ — id акаунта, тож закладки спільні на всіх пристроях;
 * для решти — анонімна кука balabony_uid, як у прогресі.
 */

export const dynamic = 'force-dynamic'

type Body = {
  slug?: string
  title?: string
  path?: string
  /** true — поставити закладку, false — зняти. */
  saved?: boolean
}

type Row = {
  slug: string
  title: string | null
  path: string
  created_at: string
}

async function resolveUserId(): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user?.id) return data.user.id
  } catch {
    // не залогінений — падаємо на анонімний id
  }
  return getOrCreateAnonUserId()
}

export async function POST(req: NextRequest) {
  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const slug = (b.slug ?? '').trim().slice(0, 200)
  const path = (b.path ?? '').trim()
  const title = (b.title ?? '').trim().slice(0, 300) || null
  if (slug === '' || !path.startsWith('/')) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const userId = await resolveUserId()

    if (b.saved === false) {
      await dbQuery(
        `delete from reading_bookmarks where user_id = $1 and slug = $2`,
        [userId, slug],
      )
      return NextResponse.json({ ok: true, saved: false })
    }

    await dbQuery(
      `insert into reading_bookmarks (user_id, slug, title, path)
       values ($1, $2, $3, $4)
       on conflict (user_id, slug) do update
         set title = excluded.title,
             path = excluded.path`,
      [userId, slug, title, path],
    )
    return NextResponse.json({ ok: true, saved: true })
  } catch {
    // Закладка не критична: якщо база не відповіла, читання не ламаємо.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const one = (url.searchParams.get('slug') ?? '').trim().slice(0, 200)
  const rawLimit = Number(url.searchParams.get('limit'))
  const limit = Math.max(1, Math.min(100, Number.isFinite(rawLimit) ? rawLimit : 50))

  try {
    const userId = await resolveUserId()

    // Питання про один твір: чи стоїть закладка (для стану кнопки).
    if (one !== '') {
      const res = await dbQuery(
        `select slug from reading_bookmarks where user_id = $1 and slug = $2`,
        [userId, one],
      )
      return NextResponse.json({ saved: res.rows.length > 0 })
    }

    const res = await dbQuery(
      `select slug, title, path, created_at
         from reading_bookmarks
        where user_id = $1
        order by created_at desc
        limit $2`,
      [userId, limit],
    )
    return NextResponse.json({ items: res.rows as Row[] })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
