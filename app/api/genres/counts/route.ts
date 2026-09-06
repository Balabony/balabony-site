import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { GENRES } from '@/lib/genres'

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
  const db = getSupabaseAdmin()

  const counts = await Promise.all(
    GENRES.map(async (genre) => {
      const { count } = await db
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'story')
        .in('status', ['approved', 'published'])
        .eq('genre', genre)
      return { genre, count: count ?? 0 }
    }),
  )

  return NextResponse.json(
    { genres: counts.filter((g) => g.count > 0) },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } },
  )
}
