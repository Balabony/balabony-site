/**
 * app/api/pick/route.ts
 *
 * API for tracking anonymous user picks for free content.
 *
 * Business rules (locked in HANDOFF v45):
 *   - SERIES: user picks up to 2 episodes per season (4 seasons × 2 = 8 total max)
 *   - STORIES: user picks up to 7 stories from the entire catalog
 *   - Picks are idempotent: re-picking the same content is a no-op (alreadyPicked: true)
 *   - User identity = HttpOnly cookie (balabony_uid, UUID v4, 1 year)
 *
 * Routes:
 *   GET  /api/pick           → all picks for current user
 *   POST /api/pick           → register a new pick (or no-op if already picked)
 *
 * Storage: Supabase table public.user_free_picks
 *   See: supabase/migrations/20260527_001_user_free_picks.sql
 *
 * Security:
 *   - user_id never trusted from client body — always from HttpOnly cookie
 *   - service_role Supabase client (getSupabaseAdmin) bypasses RLS; we enforce limits in code
 *   - UNIQUE constraint on (user_id, content_type, content_id) makes inserts idempotent
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getOrCreateAnonUserId } from '@/lib/anon-user'

// ─── Constants ──────────────────────────────────────────────────────────────

const SERIES_PER_SEASON_LIMIT = 2
const STORIES_TOTAL_LIMIT = 7
const MAX_REFERRAL_BONUS = 5 // +1 free story per unique story shared, capped
const MAX_REFERRAL_BONUS_SERIES = 3 // +1 free series per unique episode shared, per season
const SEASONS_COUNT = 4
const EPISODES_PER_SEASON = 20
const TOTAL_EPISODES = SEASONS_COUNT * EPISODES_PER_SEASON // 80

// ─── Types ──────────────────────────────────────────────────────────────────

type ContentType = 'series' | 'story'

interface PickRow {
  user_id: string
  content_type: ContentType
  season: number | null
  content_id: number
  picked_at: string
}

interface PostBody {
  contentType?: unknown
  season?: unknown
  contentId?: unknown
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isContentType(v: unknown): v is ContentType {
  return v === 'series' || v === 'story'
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0
}

function isValidSeason(v: unknown): v is number {
  return (
    typeof v === 'number' &&
    Number.isInteger(v) &&
    v >= 1 &&
    v <= SEASONS_COUNT
  )
}

function isValidSeriesContentId(v: unknown): v is number {
  return (
    typeof v === 'number' &&
    Number.isInteger(v) &&
    v >= 1 &&
    v <= TOTAL_EPISODES
  )
}

/**
 * Verifies that for a SERIES pick, the content_id (globalEp 1-80)
 * actually belongs to the claimed season. Prevents clients from
 * sneaking high-numbered episodes into season 1.
 */
function seasonMatchesContentId(season: number, contentId: number): boolean {
  const minGlobal = (season - 1) * EPISODES_PER_SEASON + 1
  const maxGlobal = season * EPISODES_PER_SEASON
  return contentId >= minGlobal && contentId <= maxGlobal
}

// ─── GET /api/pick ──────────────────────────────────────────────────────────

export async function GET() {
  try {
    const userId = await getOrCreateAnonUserId()
    const supabase = getSupabaseAdmin()

    // Check active subscription (frontend uses this to mark all episodes
    // as unlocked without relying on per-episode picks).
    const nowIso = new Date().toISOString()
    const { data: activeSub } = await supabase
      .from('app_subscriptions')
      .select('id, plan, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', nowIso)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data, error } = await supabase
      .from('user_free_picks')
      .select('content_type, season, content_id, picked_at')
      .eq('user_id', userId)
      .order('picked_at', { ascending: true })

    if (error) {
      console.error('[/api/pick GET] supabase error:', error)
      return NextResponse.json(
        { ok: false, reason: 'db_error', message: 'Failed to load picks' },
        { status: 500 }
      )
    }

    const rows = (data ?? []) as Pick<
      PickRow,
      'content_type' | 'season' | 'content_id' | 'picked_at'
    >[]

    const series = rows
      .filter((r) => r.content_type === 'series')
      .map((r) => ({
        season: r.season,
        globalEp: r.content_id,
        pickedAt: r.picked_at,
      }))

    const stories = rows
      .filter((r) => r.content_type === 'story')
      .map((r) => ({
        id: r.content_id,
        pickedAt: r.picked_at,
      }))

    return NextResponse.json({
      ok: true,
      userId,
      subscriber: activeSub ? {
        plan: activeSub.plan,
        expiresAt: activeSub.expires_at,
      } : null,
      picks: { series, stories },
      limits: {
        seriesPerSeason: SERIES_PER_SEASON_LIMIT,
        storiesTotal: STORIES_TOTAL_LIMIT,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error'
    console.error('[/api/pick GET] unhandled:', err)
    return NextResponse.json(
      { ok: false, reason: 'internal_error', message },
      { status: 500 }
    )
  }
}

// ─── POST /api/pick ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody

    // ── Validate contentType
    if (!isContentType(body.contentType)) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'invalid_input',
          message: 'contentType must be "series" or "story"',
        },
        { status: 400 }
      )
    }

    const contentType: ContentType = body.contentType
    const contentId = body.contentId

    // ── Validate contentId
    if (!isPositiveInt(contentId)) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'invalid_input',
          message: 'contentId must be a positive integer',
        },
        { status: 400 }
      )
    }

    // ── Branch-specific validation
    let season: number | null = null

    if (contentType === 'series') {
      if (!isValidSeason(body.season)) {
        return NextResponse.json(
          {
            ok: false,
            reason: 'invalid_input',
            message: `season must be 1..${SEASONS_COUNT}`,
          },
          { status: 400 }
        )
      }
      if (!isValidSeriesContentId(contentId)) {
        return NextResponse.json(
          {
            ok: false,
            reason: 'invalid_input',
            message: `contentId must be a globalEp 1..${TOTAL_EPISODES}`,
          },
          { status: 400 }
        )
      }
      if (!seasonMatchesContentId(body.season, contentId)) {
        return NextResponse.json(
          {
            ok: false,
            reason: 'invalid_input',
            message: 'season does not match contentId range',
          },
          { status: 400 }
        )
      }
      season = body.season
    } else {
      // story: season must be absent or undefined
      if (body.season !== undefined && body.season !== null) {
        return NextResponse.json(
          {
            ok: false,
            reason: 'invalid_input',
            message: 'season must be null/omitted for stories',
          },
          { status: 400 }
        )
      }
      season = null
    }

    // ── Identity + DB
    const userId = await getOrCreateAnonUserId()
    const supabase = getSupabaseAdmin()

    // ── Subscribers bypass picks entirely: they have unlimited access via
    // app_subscriptions, so we don't need to record per-episode picks for them.
    // Return ok so the frontend can star the episode visually without hitting
    // the per-season limit.
    const nowIso = new Date().toISOString()
    const { data: activeSub } = await supabase
      .from('app_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', nowIso)
      .limit(1)
      .maybeSingle()

    if (activeSub) {
      return NextResponse.json({
        ok: true,
        picked: true,
        subscriber: true,
        picksTotal: 0,
        picksInSeason: 0,
      })
    }

    // ── Idempotent check: is this exact pick already in DB?
    const { data: existing, error: existingError } = await supabase
      .from('user_free_picks')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle()

    if (existingError) {
      console.error('[/api/pick POST] existing check error:', existingError)
      return NextResponse.json(
        { ok: false, reason: 'db_error', message: 'Failed to check picks' },
        { status: 500 }
      )
    }

    if (existing) {
      // Already picked — idempotent success. Still return current counts.
      const counts = await getCounts(supabase, userId, contentType, season)
      return NextResponse.json({
        ok: true,
        picked: true,
        alreadyPicked: true,
        ...counts,
      })
    }

    // ── Count current picks (for limit check)
    const counts = await getCounts(supabase, userId, contentType, season)

    if (contentType === 'series') {
      // Free series limit per season grows with earned referral bonuses
      // (+1 per unique episode shared in this season, capped).
      const seasonBonus = await getReferralBonus(supabase, userId, season)
      const seasonLimit = SERIES_PER_SEASON_LIMIT + seasonBonus
      if ((counts.picksInSeason ?? 0) >= seasonLimit) {
        // Користувач уперся в ліміт безкоштовних серій у сезоні —
        // найсильніший сигнал готовності платити. Фіксуємо подію.
        await recordPaywallHit(supabase, userId, 'series', season, contentId, 'season_limit_reached')
        return NextResponse.json(
          {
            ok: false,
            reason: 'season_limit_reached',
            message: `Вже обрано ${seasonLimit} серії в цьому сезоні`,
            ...counts,
          },
          { status: 200 } // not an error — expected business case
        )
      }
    } else {
      // Free story limit grows with earned referral bonuses (+1 per unique
      // story shared, capped at MAX_REFERRAL_BONUS).
      const bonus = await getReferralBonus(supabase, userId, null)
      const storyLimit = STORIES_TOTAL_LIMIT + bonus
      if (counts.picksTotal >= storyLimit) {
        // Користувач уперся в ліміт безкоштовних історій — фіксуємо пейвол.
        await recordPaywallHit(supabase, userId, 'story', null, contentId, 'stories_limit_reached')
        return NextResponse.json(
          {
            ok: false,
            reason: 'stories_limit_reached',
            message: `Вже обрано ${storyLimit} історій`,
            ...counts,
          },
          { status: 200 }
        )
      }
    }

    // ── Insert
    const { error: insertError } = await supabase
      .from('user_free_picks')
      .insert({
        user_id: userId,
        content_type: contentType,
        season,
        content_id: contentId,
      })

    if (insertError) {
      // 23505 = unique_violation. Could happen on a race (two parallel POSTs
      // with the same payload). Treat as already-picked, idempotent success.
      if (insertError.code === '23505') {
        const refreshed = await getCounts(supabase, userId, contentType, season)
        return NextResponse.json({
          ok: true,
          picked: true,
          alreadyPicked: true,
          ...refreshed,
        })
      }
      console.error('[/api/pick POST] insert error:', insertError)
      return NextResponse.json(
        { ok: false, reason: 'db_error', message: 'Failed to save pick' },
        { status: 500 }
      )
    }

    // ── Success — refetch counts AFTER insert so they reflect the new pick
    const refreshed = await getCounts(supabase, userId, contentType, season)

    return NextResponse.json({
      ok: true,
      picked: true,
      alreadyPicked: false,
      ...refreshed,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error'
    console.error('[/api/pick POST] unhandled:', err)
    return NextResponse.json(
      { ok: false, reason: 'internal_error', message },
      { status: 500 }
    )
  }
}

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Записує подію «користувач уперся в безкоштовний ліміт» (пейвол).
 * Це найсильніший сигнал наміру платити: дає змогу рахувати
 * скільки людей дійшли до ліміту і скільки з них стали платниками
 * (join за user_id з підписками — це той самий balabony_uid).
 *
 * Fire-and-forget: будь-яка помилка тут НЕ повинна ламати /api/pick,
 * тому загорнуто в try/catch і лише логуємо.
 */
async function recordPaywallHit(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  contentType: ContentType,
  season: number | null,
  contentId: number,
  limitType: 'season_limit_reached' | 'stories_limit_reached'
): Promise<void> {
  try {
    await supabase.from('paywall_hits').insert({
      user_id: userId,
      content_type: contentType,
      season,
      content_id: contentId,
      limit_type: limitType,
    })
  } catch (err) {
    console.error('[/api/pick] paywall_hit record failed:', err)
  }
}

/**
 * Earned referral bonuses for this user, in the relevant bucket:
 *   season === null  → free-story bonuses (cap MAX_REFERRAL_BONUS, total)
 *   season === N     → free-series bonuses for that season (cap per season)
 * Never throws — on error returns 0.
 */
async function getReferralBonus(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  season: number | null
): Promise<number> {
  try {
    let q = supabase
      .from('referral_bonuses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    q = season === null ? q.is('season', null) : q.eq('season', season)
    const { count } = await q
    const cap = season === null ? MAX_REFERRAL_BONUS : MAX_REFERRAL_BONUS_SERIES
    return Math.min(count ?? 0, cap)
  } catch {
    return 0
  }
}

/**
 * Returns current pick counts for the user.
 * - For series: returns picksInSeason (count in given season) AND picksTotal (across all seasons)
 * - For story: returns picksTotal
 */
async function getCounts(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  contentType: ContentType,
  season: number | null
): Promise<{ picksTotal: number; picksInSeason?: number }> {
  if (contentType === 'series') {
    const { count: totalCount, error: totalErr } = await supabase
      .from('user_free_picks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('content_type', 'series')

    if (totalErr) {
      console.error('[/api/pick getCounts] total error:', totalErr)
    }

    let inSeasonCount = 0
    if (season !== null) {
      const { count, error: seasonErr } = await supabase
        .from('user_free_picks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('content_type', 'series')
        .eq('season', season)

      if (seasonErr) {
        console.error('[/api/pick getCounts] season error:', seasonErr)
      }
      inSeasonCount = count ?? 0
    }

    return {
      picksTotal: totalCount ?? 0,
      picksInSeason: inSeasonCount,
    }
  }

  // story
  const { count, error } = await supabase
    .from('user_free_picks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('content_type', 'story')

  if (error) {
    console.error('[/api/pick getCounts] story error:', error)
  }

  return { picksTotal: count ?? 0 }
}
