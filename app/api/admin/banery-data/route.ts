import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

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
    db.from('user_acquisition')
      .select('user_id, utm_source, utm_medium, utm_campaign, referrer, landing_path')
      .limit(50000),
    db.from('article_reads')
      .select('user_id, completed')
      .limit(50000),
    db.from('app_subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .limit(20000),
  ])

  return NextResponse.json({
    acquisition: acq.data   ?? [],
    reads:       reads.data ?? [],
    subscribers: (subs.data ?? []).map((r: { user_id: string | null }) => r.user_id).filter(Boolean),
  })
}
