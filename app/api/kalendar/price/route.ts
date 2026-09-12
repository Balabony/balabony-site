import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { CALENDAR, calendarPrice, countEpisodeReads, EXPERT_LEVEL } from '@/lib/calendar-gift'
import { levelFromReads } from '@/lib/levels'

/**
 * Ціна календаря для того, хто зараз на сторінці.
 *
 * Потрібен, бо сторінка /kalendar — клієнтський компонент (форма й гортання
 * знімків), а рівень читача видно тільки на сервері. Роут нічого не змінює
 * і нічого не приймає: просто каже, яку ціну показати.
 *
 * Справжня сума все одно рахується в /api/kalendar/create тими самими
 * функціями — тут лише те, що бачить око.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  let userId: string | null = null
  try {
    const auth = await createSupabaseServerClient()
    const { data } = await auth.auth.getUser()
    userId = data?.user?.id ?? null
  } catch {
    // гість
  }

  const price = await calendarPrice(userId)

  if (!userId) {
    return NextResponse.json({
      price,
      base: CALENDAR.price,
      expert: false,
      toExpert: null,
    })
  }

  const reads = await countEpisodeReads(userId)
  const lvl = levelFromReads(reads)
  const expert = lvl.current.key === EXPERT_LEVEL.key

  return NextResponse.json({
    price,
    base: CALENDAR.price,
    expert,
    // Скільки серій лишилося до знижки. null — знижка вже діє.
    toExpert: expert ? null : Math.max(0, EXPERT_LEVEL.min - reads),
  })
}
