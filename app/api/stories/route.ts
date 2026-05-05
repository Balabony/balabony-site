import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('stories')
      .select('id, title, author_name, genre, text, cover_url, published_version, corrected_text, approved_at')
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
      teaser:   buildTeaser(s.published_version === 'corrected' && s.corrected_text ? s.corrected_text : s.text),
      url:      `/stories/${s.id}`,
    }))

    return NextResponse.json(stories)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

function buildTeaser(text: string): string {
  const stripped = text.replace(/\s+/g, ' ').trim()
  if (stripped.length <= 200) return stripped
  const cut = stripped.slice(0, 200)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut) + '…'
}
