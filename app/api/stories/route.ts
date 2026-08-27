import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { toExcerpt } from '@/lib/plain-text'
import { pickPublishedText } from '@/lib/published-text'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const parsed = limitParam ? parseInt(limitParam, 10) : NaN
    const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(500, parsed)) : 9

    const genreFilter        = searchParams.get('genre')         // показати тільки цей жанр
    const excludeGenreFilter = searchParams.get('exclude_genre') // приховати цей жанр

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('content')
      .select('id, slug, title, author_name, genre, text, cover_url, cover_position, published_version, corrected_text, humanized_text, approved_at, duration_minutes, category, is_adult')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .order('approved_at', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (genreFilter) {
      query = query.eq('genre', genreFilter)
    } else if (excludeGenreFilter) {
      // NULL != 'Казка' у SQL дає NULL, тому .neq() мовчки викидає всі історії
      // з порожнім жанром. Явно лишаємо і їх, і ті, чий жанр не збігається.
      const safe = excludeGenreFilter.replace(/[(),]/g, '')
      query = query.or(`genre.is.null,genre.neq.${safe}`)
    }

    const { data, error } = await query

    if (error) throw error

    const stories = (data ?? []).map(s => ({
      id:               s.id,
      title:            s.title,
      author:           s.author_name,
      coverUrl:         s.cover_url ?? '/og-image.jpg',
      coverPosition:    s.cover_position ?? 'center',
      tags:             [s.genre],
      hasAudio:         false,
      teaser:           buildTeaser(pickPublishedText(s)),
      url:              `/stories/${s.slug ?? s.id}`,
      genre:            s.genre ?? undefined,
      duration_minutes: s.duration_minutes ?? undefined,
      category:         s.category ?? undefined,
      isAdult:          s.is_adult ?? false,
    }))

    return NextResponse.json(stories)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

function buildTeaser(text: string): string {
  const stripped = toExcerpt(text, 100000)
  if (stripped.length <= 200) return stripped
  const cut = stripped.slice(0, 200)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut) + '…'
}
