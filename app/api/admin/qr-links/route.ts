import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Керування короткими посиланнями /g/[code] і /m/[code].
 *
 * Навіщо окрема сторінка: ціль газетного коду міняється щотижня, і досі це
 * робилось руками в SQL. 11.08.2026 ціль перевели на наступну серію за кілька
 * годин до виходу номера — код у газеті вже був надрукований на попередню.
 * Помилка коштувала б тиража, тому операція винесена в адмінку з підказкою
 * про безпечний час зміни.
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

  const [links, hits, episodes] = await Promise.all([
    db.from('qr_links')
      .select('code, target, campaign, is_active, channel')
      .order('code'),
    db.from('qr_hits')
      .select('code, created_at')
      .order('created_at', { ascending: false })
      .limit(20000),
    db.from('content')
      .select('slug, title, season_number, episode_number, is_free, status')
      .not('episode_number', 'is', null)
      .order('episode_number')
      .limit(300),
  ])

  return NextResponse.json({
    links:    links.data    ?? [],
    hits:     hits.data     ?? [],
    episodes: episodes.data ?? [],
    errors: {
      links:    links.error?.message    ?? null,
      hits:     hits.error?.message     ?? null,
      episodes: episodes.error?.message ?? null,
    },
  })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    action?: string
    code?: string
    target?: string
    campaign?: string
    channel?: string
    is_active?: boolean
  }

  const db = getSupabaseAdmin()
  const code = (body.code ?? '').trim().toLowerCase()

  if (!code) {
    return NextResponse.json({ error: 'Не вказано код' }, { status: 400 })
  }

  if (body.action === 'create') {
    const { error } = await db.from('qr_links').insert({
      code,
      target:    body.target ?? '/',
      campaign:  body.campaign ?? code,
      channel:   body.channel ?? 'gazeta',
      is_active: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Оновлення цілі або статусу
  const patch: Record<string, unknown> = {}
  if (typeof body.target === 'string')    patch.target = body.target
  if (typeof body.campaign === 'string')  patch.campaign = body.campaign
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active
  if (typeof body.channel === 'string')   patch.channel = body.channel

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Нема що змінювати' }, { status: 400 })
  }

  const { error } = await db.from('qr_links').update(patch).eq('code', code)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
