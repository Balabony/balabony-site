import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const orderParam = (searchParams.get('order') ?? 'asc').toLowerCase()
    const ascending = orderParam !== 'desc'

    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || 0)) : null

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('content')
      .select('slug, episode_number, season_number, title, cover_url, audio_status, description')
      .eq('type', 'balabony')
      .eq('status', 'published')
      .order('season_number', { ascending })
      .order('episode_number', { ascending })

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) throw error

    const mapped = (data ?? []).map(r => ({
      id: r.slug,
      number: r.episode_number,
      season: r.season_number,
      title: r.title,
      cover_url: r.cover_url,
      has_audio: r.audio_status === 'ready',
      url: `/episodes/${r.slug}`,
      description: r.description,
    }))

    return NextResponse.json(mapped)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
