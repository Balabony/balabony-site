import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const parsed = limitParam ? parseInt(limitParam, 10) : NaN
    const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(500, parsed)) : 9

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('content')
      .select('id, slug, title, author_name, genre, text, cover_url, published_version, corrected_text, humanized_text, approved_at, duration_minutes, category')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .order('approved_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) throw error

    const stories = (data ?? []).map(s => ({
      id:              s.id,
      title:           s.title,
      author:          s.author_name,
      coverUrl:        s.cover_url ?? '/og-image.jpg',
      tags:            [s.genre],
      hasAudio:        false,
      teaser:          buildTeaser(pickPublishedText(s)),
      url:             `/stories/${s.slug ?? s.id}`,
      genre:           s.genre ?? undefined,
      duration_minutes: s.duration_minutes ?? undefined,
      category:        s.category ?? undefined,
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
