import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('content')
      .select('slug, episode_number, season_number, title, cover_url, audio_status, description')
      .eq('type', 'balabony')
      .eq('status', 'published')
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true })

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
