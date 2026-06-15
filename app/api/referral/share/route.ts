/**
 * app/api/referral/share/route.ts
 *
 * Records a referral bonus when an anonymous user shares a story.
 *   Reward rule: +1 free story per UNIQUE story shared, capped at MAX_BONUSES.
 *   Anti-abuse:
 *     - UNIQUE(user_id, story_id) in referral_bonuses → re-sharing the same
 *       story grants nothing extra (DB enforces it; duplicate = 23505, ignored).
 *     - Hard cap MAX_BONUSES → sharing many different stories can't unlock
 *       unlimited free content.
 *
 *   user_id is the anonymous balabony_uid cookie (same id used by /api/pick),
 *   so the bonus can be added to that user's free-story limit.
 *
 * NEVER throws in a way that breaks the page: sharing is best-effort.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getOrCreateAnonUserId } from '@/lib/anon-user'

const MAX_BONUSES = 5

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const storyId = typeof body.story_id === 'string' ? body.story_id.trim() : ''
    const channel = typeof body.channel === 'string' ? body.channel.slice(0, 40) : null

    if (!storyId) {
      return NextResponse.json({ ok: false, error: 'missing story_id' }, { status: 400 })
    }

    const userId = await getOrCreateAnonUserId()
    const db = getSupabaseAdmin()

    // How many bonuses does this user already have?
    const { count: existing } = await db
      .from('referral_bonuses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    const current = existing ?? 0
    if (current >= MAX_BONUSES) {
      return NextResponse.json({ ok: true, granted: false, total: current, capped: true })
    }

    // Try to record this share. UNIQUE(user_id, story_id) makes it idempotent:
    // a repeat share of the same story is ignored (granted stays false).
    const { error } = await db
      .from('referral_bonuses')
      .insert({ user_id: userId, story_id: storyId, channel })

    // 23505 = duplicate (already rewarded for this story) → not an error for us.
    const granted = !error
    const isDuplicate = (error as { code?: string } | null)?.code === '23505'
    if (error && !isDuplicate) {
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    const total = granted ? current + 1 : current
    return NextResponse.json({ ok: true, granted, total })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
