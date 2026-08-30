import { getSupabaseAdmin } from '@/lib/supabase-server'
import { buildFeed, FEED_HEADERS, FEED_SELECT, type FeedRow } from '@/lib/rss'

/**
 * /feed.xml — загальний фід усього опублікованого.
 *
 * Окремі фіди за розділами живуть у /feed/[channel]. Загальний потрібен
 * для читалок і скрінрідерів: людині зручніше підписатися на все одразу,
 * а вже подкаст-каталогам віддаємо розділені.
 */

export const revalidate = 1800

export async function GET() {
  const supabase = getSupabaseAdmin()
  let rows: FeedRow[] = []

  try {
    const { data, error } = await supabase
      .from('content')
      .select(FEED_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(200)
    if (!error && data) rows = data as unknown as FeedRow[]
  } catch (e) {
    // Фід не мусить падати через базу — краще порожній канал, ніж 500.
    console.error('feed.xml: failed to fetch content', e)
  }

  const xml = buildFeed(
    {
      self: '/feed.xml',
      title: 'Балабони — усі нові матеріали',
      description:
        'Серіали, історії письменників і казки українською. Нові серії та твори у міру виходу.',
    },
    rows,
  )

  return new Response(xml, { headers: FEED_HEADERS })
}
