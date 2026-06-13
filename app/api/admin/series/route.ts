import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('id, slug, title, season_number, episode_number, created_at, audio_status, cover_url, analyze_report, is_premium')
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
    const { title, season, episode, description, hasAudio, analyzeReport, isPremium, coverUrl, text } = await req.json()

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
      status:         'published',
      title,
      text:           text ?? null,
      description:    description ?? null,
      episode_number: parseInt(String(episode), 10),
      season_number:  parseInt(String(season), 10),
      cover_url:      coverUrl || null,
      audio_status:   hasAudio ? 'ready' : 'pending',
      analyze_report: analyzeReport ?? null,
      is_premium:     isPremium === true,
    }, { onConflict: 'slug' })

    if (insertError) throw insertError

    // Fire cover generation asynchronously (30–90 s) only if no cover provided.
    // Якщо обкладинку вже згенерували у формі — беремо її й не платимо за повтор.
    if (!coverUrl) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
      fetch(`${baseUrl}/api/generate-cover`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ seriesId: id, title, description }),
      })
        .then(async r => {
          if (!r.ok) return
          const { url: coverUrlGen } = await r.json() as { url?: string }
          if (coverUrlGen) {
            await supabase.from('content').update({ cover_url: coverUrlGen }).eq('slug', id)
          }
        })
        .catch(() => {})
    }

    // Серія опублікована — оновлюємо кеш каталогу й головної одразу,
    // щоб нова серія зʼявилась без чекання ревалідації / редеплою.
    revalidatePath('/')
    revalidatePath('/episodes')
    revalidatePath(`/episodes/${id}`)

    return NextResponse.json({
      id,
      url,
      message: 'Серію додано. Обкладинка генерується у фоні (~60 с).',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
