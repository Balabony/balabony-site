import { NextResponse } from 'next/server'
import { getOrCreateAnonUserId } from '@/lib/anon-user'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { awardPoints, POINTS } from '@/lib/points'

const MAX_FREEZES = 2

// Дата «сьогодні» за київським часом (Europe/Kyiv).
// Локаль en-CA дає формат YYYY-MM-DD. Перехід літо/зима враховується автоматично.
function todayKyiv(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00Z').getTime()
  const b = new Date(to + 'T00:00:00Z').getTime()
  return Math.round((b - a) / 86400000)
}

interface StreakRow {
  current_streak: number
  longest_streak: number
  last_read_date: string
  freezes_left:   number
}

export async function GET() {
  try {
    const userId = await getOrCreateAnonUserId()
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, last_read_date, freezes_left')
      .eq('user_id', userId)
      .single()

    if (!data) {
      return NextResponse.json({ current: 0, longest: 0, freezes: MAX_FREEZES, readToday: false })
    }

    const row = data as StreakRow
    const gap = daysBetween(row.last_read_date, todayKyiv())
    let current = row.current_streak
    if (gap > 1) {
      const missed = gap - 1
      if (missed > row.freezes_left) current = 0
    }
    return NextResponse.json({
      current,
      longest:   row.longest_streak,
      freezes:   row.freezes_left,
      readToday: gap === 0,
    })
  } catch {
    // Раніше тут поверталися нулі зі статусом 200, і бейдж показував читачеві
    // «0 днів» — тобто збій бази виглядав як утрачений стрік. Тепер віддаємо
    // помилку: краще не показати нічого, ніж показати чужу поразку.
    return NextResponse.json({ error: 'streak unavailable' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const userId = await getOrCreateAnonUserId()
    const supabase = getSupabaseAdmin()
    const today = todayKyiv()
    await awardPoints(userId, 'streak', today, POINTS.streak)

    const { data } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, last_read_date, freezes_left')
      .eq('user_id', userId)
      .single()

    if (!data) {
      await supabase.from('user_streaks').upsert({
        user_id: userId, current_streak: 1, longest_streak: 1, last_read_date: today, freezes_left: MAX_FREEZES,
      })
      return NextResponse.json({ current: 1, longest: 1, freezes: MAX_FREEZES })
    }

    const row = data as StreakRow
    const gap = daysBetween(row.last_read_date, today)
    let current = row.current_streak
    let freezes = row.freezes_left

    if (gap === 0) {
      return NextResponse.json({ current, longest: row.longest_streak, freezes })
    } else if (gap === 1) {
      current += 1
    } else {
      const missed = gap - 1
      if (missed <= freezes) {
        freezes -= missed
        current += 1
      } else {
        current = 1
        freezes = MAX_FREEZES
      }
    }

    const longest = Math.max(current, row.longest_streak)
    await supabase.from('user_streaks').upsert({
      user_id: userId, current_streak: current, longest_streak: longest, last_read_date: today, freezes_left: freezes,
    })
    return NextResponse.json({ current, longest, freezes })
  } catch {
    return NextResponse.json({ current: 0, longest: 0, freezes: MAX_FREEZES })
  }
}
