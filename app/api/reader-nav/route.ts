import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const EMPTY = { prev: null as string | null, next: null as string | null }

// Сусідні матеріали для рідера: казка↔казка, історія↔історія, за датою.
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json(EMPTY)

    const supabase = getSupabaseAdmin()

    const { data: cur } = await supabase
      .from('content')
      .select('genre')
      .eq('type', 'story')
      .eq('slug', slug)
      .in('status', ['approved', 'published'])
      .limit(1)
      .maybeSingle()

    if (!cur) return NextResponse.json(EMPTY)

    const isFairytale = cur.genre === 'Казка'

    let q = supabase
      .from('content')
      .select('slug, approved_at, created_at')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .limit(20000)

    q = isFairytale ? q.eq('genre', 'Казка') : q.neq('genre', 'Казка')

    const { data: list } = await q
    if (!list || list.length === 0) return NextResponse.json(EMPTY)

    type Row = { slug: string | null; approved_at: string | null; created_at: string | null }

    // Ключ сортування: у частини архівних записів approved_at порожній,
    // тому падаємо на created_at, а далі на slug — щоб порядок був стабільний.
    const key = (r: Row) => r.approved_at || r.created_at || ''

    const sorted = (list as Row[])
      .filter((r) => !!r.slug)
      .sort((a, b) => {
        const ka = key(a)
        const kb = key(b)
        if (ka !== kb) return ka < kb ? 1 : -1
        return (a.slug as string) < (b.slug as string) ? 1 : -1
      })

    const idx = sorted.findIndex((r) => r.slug === slug)
    if (idx === -1) return NextResponse.json(EMPTY)

    const prev = idx > 0 ? sorted[idx - 1].slug : null
    const next = idx < sorted.length - 1 ? sorted[idx + 1].slug : null

    return NextResponse.json({ prev, next })
  } catch {
    return NextResponse.json(EMPTY)
  }
}
