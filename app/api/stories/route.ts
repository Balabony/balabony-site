import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { rotateDaily, mapStory } from '@/lib/home-data'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const parsed = limitParam ? parseInt(limitParam, 10) : NaN
    const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(500, parsed)) : 9

    const genreFilter        = searchParams.get('genre')         // показати тільки цей жанр
    const excludeGenreFilter = searchParams.get('exclude_genre') // приховати цей жанр

    // rotate=1 вмикає щоденну ротацію вітрини (див. rotateDaily нижче).
    // Без цього параметра роут поводиться точно як раніше — усі наявні
    // виклики (адмінка, інші сторінки) не змінюють поведінки.
    const rotate = searchParams.get('rotate') === '1'

    const supabase = getSupabaseAdmin()

    // У режимі ротації тягнемо ширшу вибірку, бо далі відсіюємо по одному
    // твору на автора і ріжемо вікно вручну.
    const fetchLimit = rotate ? 500 : limit

    let query = supabase
      .from('content')
      .select('id, slug, title, author_name, genre, text, cover_url, cover_position, published_version, corrected_text, humanized_text, approved_at, duration_minutes, category, is_adult')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .order('approved_at', { ascending: false, nullsFirst: false })
      .limit(fetchLimit)

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

    const rows = rotate ? rotateDaily(data ?? [], limit) : (data ?? [])

    const stories = rows.map(mapStory)

    // Кеш на межі мережі: відповідь віддається миттєво з кешу Vercel,
    // база опитується у фоні. Термін дорівнює кроку ротації — інакше
    // набір змінився б, а межа віддавала старий.
    return NextResponse.json(stories, {
      headers: rotate
        ? { 'Cache-Control': 'public, s-maxage=10800, stale-while-revalidate=86400' }
        : {},
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
