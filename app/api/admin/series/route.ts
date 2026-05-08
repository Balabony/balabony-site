import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, season_number, episode_number, created_at, audio_status, cover_url, analyze_report')
    .eq('type', 'balabony')
    .order('season_number', { ascending: false })
    .order('episode_number', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ series: data })
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, season, episode, description, hasAudio, analyzeReport } = await req.json()

    if (!title || !season || !episode) {
      return NextResponse.json({ error: 'title, season, episode required' }, { status: 400 })
    }

    const epNum = String(episode).padStart(2, '0')
    const id    = `s${season}e${epNum}`
    const url   = `/episodes/${id}`

    const supabase = getSupabaseAdmin()

    // Insert series without cover first — page shows placeholder immediately
    const { error: insertError } = await supabase.from('content').upsert({
      type:           'balabony',
      slug:           id,
      status:         'draft',
      title,
      description:    description ?? null,
      episode_number: parseInt(String(episode), 10),
      season_number:  parseInt(String(season), 10),
      cover_url:      null,
      audio_status:   hasAudio ? 'ready' : 'pending',
      analyze_report: analyzeReport ?? null,
    }, { onConflict: 'slug' })

    if (insertError) throw insertError

    // Fire cover generation asynchronously (30–90 s); update DB when done
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    fetch(`${baseUrl}/api/generate-cover`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ seriesId: id, title, description }),
    })
      .then(async r => {
        if (!r.ok) return
        const { url: coverUrl } = await r.json() as { url?: string }
        if (coverUrl) {
          await supabase.from('content').update({ cover_url: coverUrl }).eq('slug', id)
        }
      })
      .catch(() => {})

    return NextResponse.json({
      id,
      url,
      message: 'Серію додано. Обкладинка генерується у фоні (~60 с).',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
