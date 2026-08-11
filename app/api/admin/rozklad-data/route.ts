import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Розклад публікацій для /admin/rozklad.
 *
 * Ритм — вівторок і п'ятниця о 18:00. Читачам це обіцяно в блоці збору пошти
 * під кожною історією, тому розклад тепер зобов'язання, а не побажання.
 *
 * Сторінка зводить обидва серіали в одну стрічку, щоб було видно порожні
 * тижні заздалегідь, а не в день публікації.
 */

function checkAuth(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value
  return cookie === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin()

  const { data, error } = await db
    .from('content')
    .select('id, slug, title, season_number, episode_number, publish_at, status, is_free, is_premium')
    .not('episode_number', 'is', null)
    .order('episode_number')
    .limit(500)

  return NextResponse.json({
    episodes: data ?? [],
    error: error?.message ?? null,
  })
}

/** Призначення або зняття дати публікації. */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { slug?: string; publish_at?: string | null }
  if (!body.slug) {
    return NextResponse.json({ error: 'Не вказано серію' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { error } = await db
    .from('content')
    .update({ publish_at: body.publish_at ?? null })
    .eq('slug', body.slug)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
