// app/api/admin/bez-opysu/route.ts
// Історії без опису (20.09.2026). Стрічка UKR.NET (/feed/ukrnet.xml) бере лише історії
// зі справжнім описом — тут редакція бачить, яких описів бракує, і скільки вже готово.
// Відбір той самий, що в стрічці: опубліковані, не серіали, без 18+.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { FEED_SELECT, ukrnetReady, type FeedRow } from '@/lib/rss'

export const dynamic = 'force-dynamic'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('content')
      .select(`id, ${FEED_SELECT}`)
      .eq('status', 'published')
      .not('type', 'in', '("balabony","tysha")')
      .or('is_adult.is.null,is_adult.eq.false')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(1000)
    if (error) throw error

    const rows = (data ?? []) as unknown as (FeedRow & { id: string })[]
    const ready = rows.filter(ukrnetReady)
    const missing = rows
      .filter((r) => r.slug && r.title && !ukrnetReady(r))
      .map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        author: r.author_name,
        date: r.published_at || r.approved_at || r.created_at,
        current: r.short_description || r.description || r.hook || '',
      }))

    // У стрічці до 50 найсвіжіших готових історій.
    return NextResponse.json({ readyCount: ready.length, inFeed: Math.min(ready.length, 50), missing })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
