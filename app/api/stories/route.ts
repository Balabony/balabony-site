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

    const stories = rows.map(s => ({
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

    // Кеш на межі мережі: відповідь віддається миттєво з кешу Vercel,
    // база опитується у фоні раз на добу. Прибирає паузу на головній.
    // У режимі ротації добірка й так змінюється лише раз на добу.
    return NextResponse.json(stories, {
      headers: rotate
        ? { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }
        : {},
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

type Row = { id: string; author_name: string | null; approved_at: string | null }

// Щоденна ротація вітрини без випадковості.
//
// 1. Лишаємо по одному твору на автора — інакше три поспіль від однієї людини
//    (саме так виглядала стрічка до цієї зміни).
// 2. Сортуємо стабільно: свіжіші вперед, id як запасний ключ. approved_at
//    буває null, тому порівняння через рядок, а не через Date.
// 3. Твори останніх 7 днів завжди стоять першими — розділ називається
//    «Свіжі історії» і не повинен ховати новинку через ротацію.
// 4. Решту крутимо вікном: номер доби × limit зі згортанням через кінець.
//    При 100+ авторах це десятки днів поспіль без жодного повтору —
//    гарантовано, а не ймовірно.
function rotateDaily<T extends Row>(rows: T[], limit: number): T[] {
  const seen = new Set<string>()
  const unique: T[] = []
  for (const r of rows) {
    const key = (r.author_name ?? r.id).trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(r)
  }

  unique.sort((a, b) => {
    const av = a.approved_at ?? ''
    const bv = b.approved_at ?? ''
    if (av !== bv) return av < bv ? 1 : -1
    return a.id < b.id ? -1 : 1
  })

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const fresh = unique.filter(r => r.approved_at !== null && Date.parse(r.approved_at) >= weekAgo)
  const rest  = unique.filter(r => !(r.approved_at !== null && Date.parse(r.approved_at) >= weekAgo))

  const out = fresh.slice(0, limit)
  const need = limit - out.length
  if (need <= 0 || rest.length === 0) return out

  const day = Math.floor(Date.now() / 86400000)
  const start = ((day * limit) % rest.length + rest.length) % rest.length
  for (let i = 0; i < need; i++) {
    out.push(rest[(start + i) % rest.length])
  }
  return out
}

function buildTeaser(text: string): string {
  const stripped = toExcerpt(text, 100000)
  if (stripped.length <= 200) return stripped
  const cut = stripped.slice(0, 200)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut) + '…'
}
