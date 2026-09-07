import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { authorSlug } from '@/lib/author-slug'

/**
 * Пошук по каталогу: назви творів, імена й псевдоніми авторів.
 *
 * Свідомо простий ilike, без повнотекстового індексу: словника української
 * у Postgres немає, а стемінг англійським словником на наших текстах дає
 * гірший результат, ніж підрядок. При тисячі творів різниці у швидкості
 * не видно; переглядати рішення варто десь від десятків тисяч записів.
 */

const SECTION: Record<string, { base: string; label: string }> = {
  story:    { base: '/stories',  label: 'Історія'  },
  balabony: { base: '/episodes', label: 'Балабони' },
  tysha:    { base: '/tysha',    label: 'Тиша'     },
}

/**
 * PostgREST розбирає or() комами й дужками, а ilike — відсотками й зірочками.
 * Апостроф і крапку лишаємо: вони трапляються в прізвищах і назвах.
 */
function sanitize(raw: string): string {
  return raw
    .replace(/[,()%*\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

type WorkRow = {
  id: string
  slug: string | null
  title: string | null
  author_name: string | null
  author_id: string | null
  genre: string | null
  type: string | null
  approved_at: string | null
}

type ProfileRow = {
  display_name: string | null
  pen_name: string | null
  avatar_url: string | null
  hide_from_directory: boolean | null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = sanitize(searchParams.get('q') ?? '')

  if (q.length < 2) {
    return NextResponse.json({ query: q, works: [], authors: [] })
  }

  try {
    const supabase = getSupabaseAdmin()
    const pattern = `%${q}%`
    const needle = q.toLowerCase()

    const [worksRes, profilesRes] = await Promise.all([
      supabase
        .from('content')
        .select('id, slug, title, author_name, author_id, genre, type, approved_at')
        .in('type', ['story', 'balabony', 'tysha'])
        .in('status', ['approved', 'published'])
        .or(`title.ilike.${pattern},author_name.ilike.${pattern}`)
        .order('approved_at', { ascending: false, nullsFirst: false })
        .limit(80),
      supabase
        .from('author_profiles')
        .select('display_name, pen_name, avatar_url, hide_from_directory')
        .eq('is_active', true)
        .or(`display_name.ilike.${pattern},pen_name.ilike.${pattern}`)
        .limit(30),
    ])

    if (worksRes.error) throw worksRes.error

    const rows = (worksRes.data ?? []) as WorkRow[]

    const works = rows
      .filter((w) => w.slug && SECTION[w.type ?? ''])
      .map((w) => {
        const section = SECTION[w.type as string]
        return {
          id:     w.id,
          title:  w.title ?? 'Без назви',
          author: w.author_name ?? '',
          genre:  w.genre ?? '',
          label:  section.label,
          url:    `${section.base}/${w.slug}`,
        }
      })
      .slice(0, 40)

    // Автори з кабінетами. Ім'я й slug рахуємо так само, як на /avtory,
    // інакше посилання приведе на 404.
    const authors: { name: string; slug: string; avatar: string | null }[] = []
    const taken = new Set<string>()

    for (const p of ((profilesRes.data ?? []) as ProfileRow[])) {
      if (p.hide_from_directory) continue
      const name = p.pen_name?.trim() || p.display_name?.trim() || ''
      const slug = authorSlug(name)
      if (!name || !slug || taken.has(slug)) continue
      taken.add(slug)
      authors.push({ name, slug, avatar: p.avatar_url })
    }

    // Автори без кабінету — газетні передруки. Їхні картки на /avtory
    // будуються з author_name, тож і тут беремо звідти.
    for (const w of rows) {
      if (w.author_id) continue
      const name = (w.author_name ?? '').trim()
      if (!name || !name.toLowerCase().includes(needle)) continue
      const slug = authorSlug(name)
      if (!slug || taken.has(slug)) continue
      taken.add(slug)
      authors.push({ name, slug, avatar: null })
    }

    return NextResponse.json({
      query: q,
      works,
      authors: authors.slice(0, 12),
    })
  } catch {
    return NextResponse.json({ query: q, works: [], authors: [] }, { status: 500 })
  }
}
