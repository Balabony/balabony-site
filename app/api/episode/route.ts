import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonRaw = searchParams.get('season')
    const episodeRaw = searchParams.get('episode')
    const freeRaw = searchParams.get('free')

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
      .select('title, corrected_text, is_free, season_number, episode_number')
      .eq('type', 'balabony')
      .eq('status', 'published')
      .eq('season_number', season)
      .eq('episode_number', episode)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'episode not found' }, { status: 404 })
    }

    // Compute global episode index (1..80) to compare with freeEpisode from client
    const globalIndex = (season - 1) * 20 + episode
    const isUnlocked = data.is_free === true || globalIndex === freeEpisode

    const fullText = data.corrected_text ?? ''
    if (isUnlocked) {
      return NextResponse.json({
        title: data.title,
        content: fullText,
        locked: false,
      })
    }

    const preview = buildPreview(fullText, 3)
    return NextResponse.json({
      title: data.title,
      content: preview,
      locked: true,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 }
    )
  }
}
