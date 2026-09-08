import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getOrCreateAnonUserId } from '@/lib/anon-user'
import { dbQuery } from '@/lib/db'

/**
 * Позиція читання на сервері.
 *
 * Досі прогрес і закладки жили лише в localStorage: людина починала читати
 * на телефоні, відкривала на комп'ютері — і серіал на 103 епізоди починався
 * з нуля. Тут позиція прив'язана до користувача, а не до браузера.
 *
 * Чому окрема таблиця, а не article_reads: там ключ (user_id, content_id,
 * read_date) і поле counts_for_payout — це щоденний облік прочитань для
 * виплат авторам. Позиція скролу в тій таблиці зіпсувала б гроші.
 *
 * Для залогінених ключ — id акаунта (прогрес спільний на всіх пристроях),
 * для решти — анонімна кука balabony_uid (прогрес у межах браузера, як було).
 */

export const dynamic = 'force-dynamic'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Body = {
  contentId?: string
  slug?: string
  title?: string
  path?: string
  positionPx?: number
  percent?: number
}

type Row = {
  content_id: string | null
  slug: string
  title: string | null
  path: string
  position_px: number
  percent: number
  updated_at: string
}

async function resolveUserId(): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user?.id) return data.user.id
  } catch {
    // не залогінений або сесія не читається — падаємо на анонімний id
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

  // Ключ — slug: API епізодів віддає slug і номери сезону/серії, але не uuid.
  // content_id лишається необов'язковим — для творів, де він під рукою.
  const slug = (b.slug ?? '').trim().slice(0, 200)
  const path = (b.path ?? '').trim()
  const rawContentId = (b.contentId ?? '').trim()
  const contentId = UUID_RE.test(rawContentId) ? rawContentId : null
  if (slug === '' || !path.startsWith('/')) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const positionPx = Math.max(0, Math.round(Number(b.positionPx) || 0))
  const rawPercent = Math.round(Number(b.percent) || 0)
  const percent = Math.max(0, Math.min(100, rawPercent))
  const title = (b.title ?? '').trim().slice(0, 300) || null

  try {
    await dbQuery(
      `insert into reading_progress
         (user_id, content_id, slug, title, path, position_px, percent, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, now())
       on conflict (user_id, slug) do update
         set content_id = coalesce(excluded.content_id, reading_progress.content_id),
             title = excluded.title,
             path = excluded.path,
             position_px = excluded.position_px,
             percent = excluded.percent,
             updated_at = now()`,
      [await resolveUserId(), contentId, slug, title, path, positionPx, percent],
    )
  } catch {
    // Прогрес не критичний: якщо база не відповіла, читання не ламаємо.
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const one = (url.searchParams.get('slug') ?? '').trim().slice(0, 200)
  const rawLimit = Number(url.searchParams.get('limit'))
  const limit = Math.max(1, Math.min(12, Number.isFinite(rawLimit) ? rawLimit : 3))

  try {
    const userId = await resolveUserId()

    if (one !== '') {
      const res = await dbQuery(
        `select content_id, slug, title, path, position_px, percent, updated_at
           from reading_progress
          where user_id = $1 and slug = $2`,
        [userId, one],
      )
      const row = (res.rows as Row[])[0] ?? null
      return NextResponse.json({ item: row })
    }

    // Список для блоку «Продовжити читання»: недочитане, найсвіжіше зверху.
    const res = await dbQuery(
      `select content_id, slug, title, path, position_px, percent, updated_at
         from reading_progress
        where user_id = $1 and percent between 3 and 94
        order by updated_at desc
        limit $2`,
      [userId, limit],
    )
    return NextResponse.json({ items: res.rows as Row[] })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
