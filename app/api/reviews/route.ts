import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { resolveReaderId } from '@/lib/reader-id'
import { awardPoints, POINTS } from '@/lib/points'

/**
 * 09.09.2026. Цей роут мав ВЛАСНИЙ `new Pool(...)`, окремий від lib/db.ts —
 * два пули на одну базу. Плюс на кожен запит виконував CREATE TABLE IF NOT
 * EXISTS. Поки відгуки були недосяжні, це нікому не заважало; щойно кнопка
 * стала на сторінку твору — найчастішу на сайті — з'єднання скінчилися:
 * «EMAXCONNSESSION: max clients are limited to pool_size: 15».
 *
 * Тепер один спільний пул через dbQuery, і жодного CREATE TABLE у гарячому
 * шляху: таблиця reviews давно існує, створювати її на кожне відкриття
 * сторінки не треба.
 */

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    contentType?: string
    contentId?: string
    authorId?: string | null
    rating?: number
    comment?: string | null
  }
  const { contentType, contentId, authorId, rating, comment } = body

  if (!contentType || !contentId || !rating) {
    return NextResponse.json({ error: "Відсутні обов'язкові поля" }, { status: 400 })
  }

  try {
    // user_id беремо з акаунта (або з анонімної куки), а НЕ з того, що
    // прислав клієнт. Раніше модалка слала власний localStorage-ідентифікатор:
    // очистив браузер — і той самий читач лишав відгук за той самий твір
    // скільки завгодно разів, щоразу отримуючи бали. Та сама помилка, що
    // 09.09.2026 виправлена по всьому сайту в lib/reader-id.ts.
    const uid = await resolveReaderId()

    // Один відгук на твір від однієї людини. Перевіряємо ДО вставки, щоб не
    // плодити рядки: бали й так ідемпотентні, а от список відгуків засмітився б.
    const dup = await dbQuery(
      `SELECT 1 FROM reviews WHERE content_id = $1 AND user_id = $2 LIMIT 1`,
      [contentId, uid]
    )
    if (dup.rowCount && dup.rowCount > 0) {
      return NextResponse.json({ ok: false, error: 'Ви вже залишили відгук про цей твір' }, { status: 409 })
    }

    await dbQuery(
      `INSERT INTO reviews (content_type, content_id, author_id, rating, comment, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [contentType, contentId, authorId ?? null, rating, comment ?? null, uid]
    )
    // Бали за відгук: раз на одиницю контенту (анти-фарм повторних відгуків).
    await awardPoints(uid, 'review', `${contentType}:${contentId}`, POINTS.review)
    return NextResponse.json({ ok: true, stored: 'db', points: POINTS.review })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const authorId  = searchParams.get('authorId')
  const contentId = searchParams.get('contentId')
  // ?state=1 — легка відповідь для кнопки на сторінці твору: чи я вже
  // відгукувався і скільки відгуків усього. Повний список сюди тягти не можна,
  // сторінка твору відкривається найчастіше на сайті.
  const state     = searchParams.get('state')

  if (state && contentId) {
    try {
      const uid = await resolveReaderId()
      const r = await dbQuery(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE user_id = $2)::int AS mine,
                round(avg(rating)::numeric, 1)::float8 AS avg
           FROM reviews WHERE content_id = $1`,
        [contentId, uid]
      )
      const row = r.rows[0] as { total: number; mine: number; avg: number | null }
      return NextResponse.json({
        ok: true,
        total: row?.total ?? 0,
        mine: (row?.mine ?? 0) > 0,
        avg: row?.avg ?? null,
        points: POINTS.review,
      })
    } catch {
      // Кнопка — не головне на сторінці твору: якщо запит упав, ховаємо її.
      return NextResponse.json({ ok: false })
    }
  }

  try {
    let rows
    if (authorId) {
      const r = await dbQuery(
        `SELECT * FROM reviews WHERE author_id = $1 ORDER BY created_at DESC`,
        [authorId]
      )
      rows = r.rows
    } else if (contentId) {
      const r = await dbQuery(
        `SELECT * FROM reviews WHERE content_id = $1 ORDER BY created_at DESC`,
        [contentId]
      )
      rows = r.rows
    } else {
      const r = await dbQuery(
        `SELECT * FROM reviews ORDER BY created_at DESC LIMIT 200`
      )
      rows = r.rows
    }

    return NextResponse.json({ reviews: rows })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
