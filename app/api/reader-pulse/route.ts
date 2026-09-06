import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Три питання після прочитаної історії.
 *
 * Анонімно: жодного user_id, жодних куків. Пишемо тільки саму відповідь
 * і, якщо є, який твір читали. Цього досить, щоб зрозуміти, що люди хочуть
 * читати далі, і не досить, щоб когось ідентифікувати.
 */

const LIKED = ['yes', 'ok', 'no']
// Мусить збігатися зі списком у app/components/ReaderPulse.tsx
const GENRES = ['life', 'family', 'love', 'war', 'drama', 'humor', 'mystic', 'detective', 'kids']
const AGES = ['<18', '18-29', '30-44', '45-59', '60+']

function pick(value: unknown, allowed: string[]): string | null {
  const v = String(value ?? '')
  return allowed.includes(v) ? v : null
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown>
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const liked = pick(body.liked, LIKED)
    const genre = pick(body.genre, GENRES)
    const age = pick(body.age, AGES)

    // Порожня відповідь не варта рядка в базі.
    if (!liked && !genre && !age) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const contentId = String(body.contentId ?? '').trim() || null

    await dbQuery(
      `insert into reader_pulse (content_id, liked, genre, age_band)
       values ($1, $2, $3, $4)`,
      [contentId, liked, genre, age],
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    const err = e as { message?: string }
    console.error('[reader-pulse]', err?.message)
    // Читачеві помилку не показуємо — це не його проблема.
    return NextResponse.json({ ok: true })
  }
}
