import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getAnonUserId } from '@/lib/anon-user'

// Splits text into sentences without breaking on "..." or initials.
// Rule: a sentence ends at . ! ? followed by whitespace + capital letter (or end of text).
// Triple-dot "..." or "…" is treated as a single token, not a sentence end.
function splitIntoSentences(text: string): string[] {
  const normalized = text.replace(/\.\.\./g, '…').trim()
  if (!normalized) return []

  const sentences: string[] = []
  let buffer = ''
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    buffer += ch
    if (ch === '.' || ch === '!' || ch === '?') {
      const next = normalized[i + 1]
      // End of text, or whitespace+capital/digit/quote ahead
      if (!next || /[\s\n]/.test(next)) {
        const trimmed = buffer.trim()
        if (trimmed) sentences.push(trimmed)
        buffer = ''
      }
    }
  }
  const tail = buffer.trim()
  if (tail) sentences.push(tail)
  return sentences
}

function buildPreview(fullText: string, sentenceCount = 3): string {
  const sentences = splitIntoSentences(fullText)
  return sentences.slice(0, sentenceCount).join(' ')
}

// Estimate reading time in minutes. Ukrainian prose ~ 200 words/min.
function estimateReadingMinutes(text: string): number {
  if (!text) return 0
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonRaw = searchParams.get('season')
    const episodeRaw = searchParams.get('episode')
    const freeRaw = searchParams.get('free')
    const previewMode = searchParams.get('preview') === '1'

    const season = seasonRaw ? parseInt(seasonRaw, 10) : NaN
    const episode = episodeRaw ? parseInt(episodeRaw, 10) : NaN
    const freeEpisode = freeRaw ? parseInt(freeRaw, 10) : null

    if (isNaN(season) || isNaN(episode)) {
      return NextResponse.json(
        { error: 'season and episode are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('content')
      .select('slug, title, corrected_text, is_free, is_premium, season_number, episode_number, duration_minutes')
      .eq('type', 'balabony')
      .eq('status', 'published')
      .eq('season_number', season)
      .eq('episode_number', episode)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'episode not found' }, { status: 404 })
    }

    // episode comes already as global index (1..80)
    const globalIndex = episode

    // Server-side paywall: an episode is unlocked if ANY is true:
    //   1. is_free=true in DB (always-free episodes)
    //   2. user has an active subscription in app_subscriptions
    //   3. user already picked it via /api/pick (tracked in user_free_picks)
    // Note: legacy ?free= query parameter is parsed but ignored — kept only for
    // backward compatibility with cached URLs. Real source of truth is the DB.
    const isPremium = data.is_premium === true
    // Преміум (закриті) серії: не безкоштовні й не через pick; лише річна підписка.
    let isUnlocked = !isPremium && data.is_free === true
    if (!isUnlocked) {
      const userId = await getAnonUserId()
      if (userId) {
        // (2) Check active subscription first — cheapest check, unlocks all episodes
        const nowIso = new Date().toISOString()
        const { data: subRow } = await supabase
          .from('app_subscriptions')
          .select('id, plan')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gt('expires_at', nowIso)
          .limit(1)
          .maybeSingle()
        if (subRow && (!isPremium || subRow.plan === 'yearly')) {
          isUnlocked = true
        } else if (!isPremium) {
          // (3) Fall back to per-episode pick
          const { data: pickRow } = await supabase
            .from('user_free_picks')
            .select('id, plan')
            .eq('user_id', userId)
            .eq('content_type', 'series')
            .eq('content_id', globalIndex)
            .maybeSingle()
          if (pickRow) isUnlocked = true
        }
      }
    }

    // freeEpisode is intentionally unused — see comment above.
    void freeEpisode

    const fullText = data.corrected_text ?? ''
    const readingMinutes = estimateReadingMinutes(fullText)
    const episodeUrl = data.slug ? `/episodes/${data.slug}` : null

    // На головній (preview=1) завжди віддаємо короткий прев'ю — повний текст
    // читається на /episodes/[slug]. locked:false, щоб не показувати paywall.
    if (previewMode) {
      return NextResponse.json({
        title: data.title,
        content: buildPreview(fullText, 3),
        locked: false,
        duration_minutes: readingMinutes,
        url: episodeUrl,
      })
    }

    if (isUnlocked) {
      return NextResponse.json({
        title: data.title,
        content: fullText,
        locked: false,
        duration_minutes: readingMinutes,
        url: episodeUrl,
      })
    }

    const preview = buildPreview(fullText, 3)
    return NextResponse.json({
      title: data.title,
      content: preview,
      locked: true,
      premium: isPremium,
      duration_minutes: readingMinutes,
      url: episodeUrl,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 }
    )
  }
}
