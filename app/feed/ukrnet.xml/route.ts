import { getSupabaseAdmin } from '@/lib/supabase-server'
import { buildUkrnetFeed, FEED_HEADERS, FEED_SELECT, ukrnetReady, type FeedRow } from '@/lib/rss'

/**
 * /feed/ukrnet.xml — стрічка для новинного агрегатора UKR.NET (20.09.2026).
 *
 * Тільки нові історії письменників (без серіалів «Балабони» і «Тиша»),
 * тільки без позначки 18+ і тільки з справжнім описом: UKR.NET вимагає
 * короткий зміст на 3–4 речення без HTML. Історії без опису сюди не потрапляють,
 * доки автор або редакція його не додасть (ШІ-описи без згоди автора не робимо).
 * Рубрику UKR.NET («Суспільство») остаточно погоджуємо з їхнім менеджером.
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
      .not('type', 'in', '("balabony","tysha")')
      .or('is_adult.is.null,is_adult.eq.false')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(300)
    if (!error && data) rows = (data as unknown as FeedRow[]).filter(ukrnetReady).slice(0, 50)
  } catch (e) {
    console.error('feed/ukrnet.xml: failed to fetch content', e)
  }

  return new Response(buildUkrnetFeed(rows), { headers: FEED_HEADERS })
}
