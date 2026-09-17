// app/api/admin/genres/route.ts
//
// Список творів для екрана «Жанри» і збереження жанру.
// GET   — які твори без жанру (або всі, для перегляду).
// PATCH — проставити жанр одному або кільком творам.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isGenre } from '@/lib/genres'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url   = new URL(req.url)
  // empty | all | точна назва жанру з переліку.
  // Третій варіант доданий 16.09.2026: «Життєві історії» зібрали 143 твори —
  // це найбільший розділ платформи і найгірший за віддачею (0,42 відкриття
  // на твір проти 1,23 у драми). Причина не в жанрі, а в тому, що туди
  // звалено все підряд. Щоб розібрати купу, потрібен фільтр саме по ній.
  const only  = url.searchParams.get('only') ?? 'empty'
  const limit = Math.min(300, Math.max(1, Number(url.searchParams.get("limit") ?? 50)))

  const db = getSupabaseAdmin()
  let q = db
    .from('content')
    .select('id, title, author_name, slug, genre, status', { count: 'exact' })
    .eq('type', 'story')
    .in('status', ['approved', 'published'])
    .order('approved_at', { ascending: false })
    .limit(limit)

  if (only === 'empty') q = q.or('genre.is.null,genre.eq.')
  else if (only !== 'all' && isGenre(only)) q = q.eq('genre', only)

  // ПЕРЕГЛЯНУТІ НЕ ПОКАЗУЄМО (17.09.2026).
  //
  // Список брав найсвіжіші 50 із розділу, а збереження лишало підтверджені
  // твори в тому самому розділі — і наступна партія на дві третини
  // складалася з тих самих назв. На 265 творах «Сімейної історії» розбір не
  // мав кінця: за чотири прогони по п'ятдесят вибуло лише 59 творів, решта
  // були повторами.
  //
  // genre_reviewed_at ставиться при збереженні ВСІМ показаним творам, а не
  // лише тим, кому змінили жанр: «лишити як є» — теж рішення редактора, і
  // питати про нього вдруге не треба.
  //
  // Щоб переглянути розділ наново (змінився промпт, додано жанр) — скинути
  // позначку: update content set genre_reviewed_at = null where genre = '…'
  if (only !== 'all') q = q.is('genre_reviewed_at', null)

  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rows: data ?? [], total: count ?? 0 })
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    items?: Array<{ id: string; genre: string }>
    /** Усі id, які редактор бачив у партії — позначаємо переглянутими. */
    seen?: string[]
  }
  const items = Array.isArray(body.items) ? body.items : []
  const seen = Array.isArray(body.seen) ? body.seen : []
  if (items.length === 0 && seen.length === 0) {
    return NextResponse.json({ error: 'Нічого зберігати' }, { status: 400 })
  }

  // Приймаємо лише жанри з канонічного переліку: інакше в базу потрапить
  // те, чого немає у фільтрах, і твір зникне з навігації.
  const bad = items.find(i => !isGenre(i.genre))
  if (bad) {
    return NextResponse.json({ error: `Невідомий жанр: ${bad.genre}` }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const now = new Date().toISOString()
  let saved = 0

  // Зміна жанру й позначка перегляду — одним оновленням на твір.
  await Promise.all(items.map(async (item) => {
    const { error } = await db
      .from('content')
      .update({ genre: item.genre, genre_reviewed_at: now })
      .eq('id', item.id)
    if (!error) saved++
  }))

  // Решта показаних — жанр не міняли, але переглянули. Без цього вони
  // повертатимуться в кожну наступну партію.
  const changed = new Set(items.map(i => i.id))
  const rest = seen.filter(id => !changed.has(id))
  if (rest.length > 0) {
    await db.from('content').update({ genre_reviewed_at: now }).in('id', rest)
  }

  return NextResponse.json({ ok: true, saved, reviewed: saved + rest.length })
}
