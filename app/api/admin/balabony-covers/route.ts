import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Список обкладинок серій «Балабонів» для ревізії: сітка на /admin/balabony-covers.
//
// Навіщо окремий endpoint, коли є /api/admin/cover-position:
// той віддає id/title/slug/cover_url, але БЕЗ season_number та episode_number.
// Для перегляду обкладинок номер серії — головне, бо саме його називають,
// коли просять перегенерувати конкретну картинку. Плюс тут не потрібна
// пагінація по 60: серій ~102, вони віддаються одним списком і сортуються
// за сезоном і номером, а не за датою.

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('content')
    .select('id, slug, title, season_number, episode_number, cover_url, cover_position, status, is_premium')
    .eq('type', 'balabony')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data ?? []
  const withoutCover = rows.filter(r => !r.cover_url).length

  return NextResponse.json({
    rows,
    total: rows.length,
    withoutCover,
  })
}
