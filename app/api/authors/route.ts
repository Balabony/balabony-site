import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { authorSlug } from '@/lib/author-slug'

/**
 * Автори для рядка «Наші автори» на головній.
 *
 * Показуємо тільки тих, хто:
 *   — активний (is_active),
 *   — не сховався перемикачем hide_from_directory,
 *   — має щонайменше один опублікований твір: порожня сторінка автора гірша
 *     за його відсутність у стрічці.
 *
 * Порядок — щоденна ротація тим самим механізмом, що у «Свіжих історіях»:
 * номер доби зсуває вікно. Детерміновано, тому всі відвідувачі за добу
 * бачать однакове і кеш на межі мережі працює.
 *
 * Роут існує окремо від сторінки, бо app/page.tsx — клієнтський компонент:
 * серверний доступ до бази в ньому неможливий.
 */

type ProfileRow = {
  user_id: string
  display_name: string | null
  pen_name: string | null
  avatar_url: string | null
  hide_from_directory: boolean | null
}

function displayName(p: ProfileRow): string {
  return p.pen_name?.trim() || p.display_name?.trim() || ''
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = parseInt(searchParams.get('limit') ?? '', 10)
    const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(50, parsed)) : 8

    const supabase = getSupabaseAdmin()

    const { data: profileData, error } = await supabase
      .from('author_profiles')
      .select('user_id, display_name, pen_name, avatar_url, hide_from_directory')
      .eq('is_active', true)

    if (error || !profileData) return NextResponse.json([])
    const profiles = profileData as ProfileRow[]

    // Автори, у яких є хоч один опублікований твір. Читаємо сторінками:
    // Supabase мовчки віддає максимум 1000 рядків.
    const withWorks = new Set<string>()
    const PAGE = 1000
    for (let from = 0; from < 10000; from += PAGE) {
      const { data, error: wErr } = await supabase
        .from('content')
        .select('author_id')
        .eq('type', 'story')
        .in('status', ['approved', 'published'])
        .not('author_id', 'is', null)
        .range(from, from + PAGE - 1)
      if (wErr || !data || data.length === 0) break
      for (const r of data as { author_id: string | null }[]) {
        if (r.author_id) withWorks.add(r.author_id)
      }
      if (data.length < PAGE) break
    }

    const all = []
    for (const p of profiles) {
      if (p.hide_from_directory) continue
      if (!withWorks.has(p.user_id)) continue
      const name = displayName(p)
      if (!name) continue
      all.push({
        slug: authorSlug(name),
        name,
        avatar: p.avatar_url,
        initials: initialsOf(name),
      })
    }

    if (all.length === 0) return NextResponse.json([])

    // Стабільний порядок, щоб зсув був передбачуваний.
    all.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))

    const day = Math.floor(Date.now() / 86400000)
    const start = ((day * limit) % all.length + all.length) % all.length
    const out = []
    for (let i = 0; i < Math.min(limit, all.length); i++) {
      out.push(all[(start + i) % all.length])
    }

    return NextResponse.json(out, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
