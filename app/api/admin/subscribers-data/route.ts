import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Список підписників для /admin/pidpysnyky.
 *
 * Це база, заради якої стоїть блок збору пошти під кожною історією. Поле
 * `source` показує, з якого саме тексту людина підписалась — по ньому видно,
 * які історії варто ставити в газету наступного тижня.
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

  const [subs, catalog] = await Promise.all([
    db.from('subscribers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20000),
    db.from('content')
      .select('slug, title')
      .in('status', ['approved', 'published'])
      .limit(2000),
  ])

  return NextResponse.json({
    subs:    subs.data    ?? [],
    catalog: catalog.data ?? [],
    errors: {
      subs:    subs.error?.message    ?? null,
      catalog: catalog.error?.message ?? null,
    },
  })
}
