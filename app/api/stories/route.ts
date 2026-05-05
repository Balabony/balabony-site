import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('stories')
      .select('id, title, author_name, genre, text, cover_url, published_version, corrected_text, humanized_text, approved_at')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(9)

    if (error) throw error

    const stories = (data ?? []).map(s => ({
      id:       s.id,
      title:    s.title,
      author:   s.author_name,
      coverUrl: s.cover_url ?? '/og-image.jpg',
      tags:     [s.genre],
      hasAudio: false,
      teaser:   buildTeaser(pickPublishedText(s)),
      url:      `/stories/${s.id}`,
    }))

    return NextResponse.json(stories)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

function pickPublishedText(s: { text: string; corrected_text: string | null; humanized_text: string | null; published_version: string | null }): string {
  const v = s.published_version ?? 'original'
  if ((v === 'humanized' || v === 'corrected_humanized') && s.humanized_text) return s.humanized_text
  if (v === 'corrected' && s.corrected_text) return s.corrected_text
  return s.text
}

function buildTeaser(text: string): string {
  const stripped = text.replace(/\s+/g, ' ').trim()
  if (stripped.length <= 200) return stripped
  const cut = stripped.slice(0, 200)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut) + '…'
}
