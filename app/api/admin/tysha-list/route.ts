// app/api/admin/tysha-list/route.ts
// Список серій «Тиші» (type='tysha') для редактора /admin/tysha.
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('content')
      .select('id, slug, title, season_number, episode_number, status')
      .eq('type', 'tysha')
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true })

    if (error) throw error
    return NextResponse.json({ items: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
