import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Сусідні матеріали для рідера: казка↔казка, історія↔історія, за датою.
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    if (!slug) return NextResponse.json({ prev: null, next: null })

    const supabase = getSupabaseAdmin()

    const { data: cur } = await supabase
      .from('content')
      .select('genre')
      .eq('type', 'story')
      .eq('slug', slug)
      .in('status', ['approved', 'published'])
      .maybeSingle()

    if (!cur) return NextResponse.json({ prev: null, next: null })

    const isFairytale = cur.genre === 'Казка'

    let q = supabase
      .from('content')
      .select('slug')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .order('approved_at', { ascending: false, nullsFirst: false })

    q = isFairytale ? q.eq('genre', 'Казка') : q.neq('genre', 'Казка')

    const { data: list } = await q
    if (!list || list.length === 0) return NextResponse.json({ prev: null, next: null })

    const idx = list.findIndex(r => r.slug === slug)
    const prev = idx > 0 ? list[idx - 1].slug : null
    const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1].slug : null

    return NextResponse.json({ prev, next })
  } catch {
    return NextResponse.json({ prev: null, next: null })
  }
}
