import { getSupabaseAdmin } from '@/lib/supabase-server'

export type PointKind = 'read' | 'streak' | 'review' | 'survey' | 'gift_spend'

// Скільки балів за кожну дію (одне джерело правди).
export const POINTS = {
  read:   10,
  streak: 5,
  review: 15,
  survey: 50,
} as const

/**
 * Ідемпотентне нарахування. ref робить подію унікальною.
 * Повторний виклик з тим самим (userId, kind, ref) НЕ дублює бали.
 * Помилка нарахування не ламає основну дію (читання/відгук/опитування).
 */
export async function awardPoints(
  userId: string,
  kind: PointKind,
  ref: string,
  points: number,
): Promise<void> {
  try {
    const db = getSupabaseAdmin()
    await db.from('point_events').upsert(
      { user_id: userId, kind, ref, points },
      { onConflict: 'user_id,kind,ref', ignoreDuplicates: true },
    )
  } catch {
    /* мовчазно: бали — побічна винагорода, не критичний шлях */
  }
}

/** Поточний баланс (сума всіх подій користувача). */
export async function getBalance(userId: string): Promise<number> {
  try {
    const db = getSupabaseAdmin()
    const { data } = await db
      .from('point_events')
      .select('points')
      .eq('user_id', userId)
    if (!data) return 0
    return (data as { points: number }[]).reduce((s, r) => s + r.points, 0)
  } catch {
    return 0
  }
}
