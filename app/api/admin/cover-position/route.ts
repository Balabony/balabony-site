import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

/**
 * Список творів з обкладинками — для екрана підгонки кадру.
 * Віддає лише те, що потрібно картці: хто автор, яке фото, як воно зараз
 * розташоване. Сам текст твору не тягнемо, щоб сторінка вантажилась швидко.
 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url    = new URL(req.url)
  const q      = (url.searchParams.get('q') ?? '').trim()
  const only   = url.searchParams.get('only') ?? 'all'   // all | unset
  const type   = url.searchParams.get('type') ?? 'story'
  const limit  = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? 60)))
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0))

  const sb = getSupabaseAdmin()
  let query = sb
    .from('content')
    .select('id, title, author_name, slug, cover_url, cover_position, status, type', { count: 'exact' })
    .not('cover_url', 'is', null)
    .in('status', ['approved', 'published'])
    .order('approved_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type !== 'all') query = query.eq('type', type)
  if (only === 'unset') query = query.or('cover_position.is.null,cover_position.eq.center')
  if (q) query = query.or(`title.ilike.%${q}%,author_name.ilike.%${q}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rows: data ?? [], total: count ?? 0 })
}
