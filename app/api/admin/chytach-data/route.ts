import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Дані для /admin/chytach — шлях читача після першої серії.
 *
 * Питання, на які відповідає:
 *   — скільки з тих, хто прочитав серію 1, взялися за серію 2;
 *   — який відсоток дочитування має кожна серія (де кидають);
 *   — скільки впиралося в замок на серії 3;
 *   — чи читали щось інше, крім «Балабонів».
 *
 * Джерела: article_reads (відкриття/дочитування), paywall_hits (замок),
 * user_acquisition (звідки прийшов читач).
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
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const [reads, paywall, acq, episodes, catalog, subs] = await Promise.all([
    db.from('article_reads')
      .select('user_id, content_id, article_slug, article_title, completed, read_percentage, read_date, time_spent_seconds')
      .gte('read_date', since.toISOString().slice(0, 10))
      .limit(50000),
    db.from('paywall_hits')
      .select('user_id, limit_type, hit_at, content_id, content_type')
      .gte('hit_at', since.toISOString())
      .limit(20000),
    db.from('user_acquisition')
      .select('user_id, utm_source, utm_medium, utm_campaign')
      .limit(50000),
    // Перелік серій, щоб знати порядок і назви
    db.from('content')
      .select('id, slug, title, season_number, episode_number, type')
      .not('episode_number', 'is', null)
      .limit(500),
    // Увесь опублікований каталог — потрібні жанр і автор, щоб бачити смаки
    db.from('content')
      .select('slug, title, genre, author_name, type')
      .in('status', ['approved', 'published'])
      .limit(2000),
    // Підписки — щоб знати, хто з читачів лишив пошту
    db.from('subscribers')
      .select('email, source, created_at')
      .limit(20000),
  ])

  return NextResponse.json({
    reads:    reads.data    ?? [],
    paywall:  paywall.data  ?? [],
    acq:      acq.data      ?? [],
    episodes: episodes.data ?? [],
    catalog:  catalog.data  ?? [],
    subs:     subs.data     ?? [],
    errors: {
      reads:    reads.error?.message    ?? null,
      paywall:  paywall.error?.message  ?? null,
      acq:      acq.error?.message      ?? null,
      episodes: episodes.error?.message ?? null,
      catalog:  catalog.error?.message  ?? null,
      subs:     subs.error?.message     ?? null,
    },
  })
}
