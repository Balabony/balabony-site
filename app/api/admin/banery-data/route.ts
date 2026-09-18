import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { fetchAll } from '@/lib/fetch-all'

/**
 * Дані для /admin/banery — ефективність кожного банера і кожного каналу.
 *
 * Питання, на які відповідає:
 *   — скільки людей привела кожна мітка utm_campaign (тобто кожен банер);
 *   — скільки з них узагалі щось відкрили на сайті;
 *   — скільки дочитали хоча б один текст;
 *   — скільки оформили підписку.
 *
 * Джерела: user_acquisition (звідки прийшов), article_reads (що читав),
 * app_subscriptions (чи платить).
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

  const [acq, reads, subs] = await Promise.all([
    // fetchAll — бо Supabase віддає максимум 1000 рядків за запит (див. lib/fetch-all.ts).
    fetchAll((a, b) => db.from('user_acquisition')
      .select('user_id, utm_source, utm_medium, utm_campaign, referrer, landing_path')
      .order('user_id')
      .range(a, b), 50000),
    fetchAll((a, b) => db.from('article_reads')
      .select('user_id, completed')
      .order('read_date').order('user_id').order('content_id')
      .range(a, b), 50000),
    fetchAll((a, b) => db.from('app_subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('user_id')
      .range(a, b), 20000),
  ])

  return NextResponse.json({
    acquisition: acq.data   ?? [],
    reads:       reads.data ?? [],
    subscribers: (subs.data ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean),
  })
}
