import { NextResponse } from 'next/server'
import { getGenreCounts } from '@/lib/home-data'

/**
 * Кількість опублікованих історій у кожному жанрі.
 *
 * Потрібно для рядка жанрів на головній. Ключове рішення: жанр, у якому
 * немає жодного твору, у відповідь не потрапляє. Читач, який натиснув
 * «Детектив» і побачив порожньо, більше не натисне нічого — а зараз жанри
 * саме проставляються, і половина розділів іще порожня. Так рядок
 * наповнюється сам, у міру роботи редактора.
 *
 * Рахуємо запитами count по кожному жанру, а не вибіркою всіх творів:
 * рядків уже понад тисячу, і тягнути їх заради дев'яти чисел марно.
 */

export const revalidate = 900

export async function GET() {
  const genres = await getGenreCounts()
  return NextResponse.json(
    { genres },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } },
  )
}
