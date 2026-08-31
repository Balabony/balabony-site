import { getSupabaseAdmin } from '@/lib/supabase-server'
import { buildFeed, BASE_URL, FEED_HEADERS, FEED_SELECT, type Channel, type FeedRow } from '@/lib/rss'

/**
 * Фіди за розділами: /feed/balabony.xml, /feed/tysha.xml, /feed/stories.xml
 *
 * Розділені навмисно. Подкаст-каталог — це один канал = один серіал;
 * якщо змішати сімейних «Балабонів» з «Тишею» 18+, канал або відхилять,
 * або доведеться позначати все як explicit.
 */

export const revalidate = 1800

const CHANNELS: Record<string, { types: string[] } & Omit<Channel, 'self'>> = {
  balabony: {
    types: ['balabony'],
    title: 'Балабони — сімейний серіал',
    description: 'Історії з українського села. Нові серії у міру виходу.',
    image: `${BASE_URL}/cover-balabony.png`,
  },
  tysha: {
    types: ['tysha'],
    title: 'Тиша — авторський серіал',
    description:
      'Військова драма про життя тилу й повернення з війни. Матеріал для дорослих читачів.',
    explicit: true,
    image: `${BASE_URL}/cover-tysha.png`,
  },
  stories: {
    types: [],           // усе, що не balabony і не tysha
    title: 'Балабони — історії письменників',
    description: 'Короткі історії сучасних українських авторів.',
    image: `${BASE_URL}/cover-stories.png`,
  },
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ channel: string }> },
) {
  const { channel } = await params
  const key = channel.replace(/\.xml$/, '')
  const cfg = CHANNELS[key]

  if (!cfg) {
    return new Response('Такого фіду немає', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const supabase = getSupabaseAdmin()
  let rows: FeedRow[] = []

  try {
    let q = supabase.from('content').select(FEED_SELECT).eq('status', 'published')
    q = cfg.types.length
      ? q.in('type', cfg.types)
      : q.not('type', 'in', '("balabony","tysha")')

    const { data, error } = await q
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(300)
    if (!error && data) rows = data as unknown as FeedRow[]
  } catch (e) {
    console.error(`feed/${key}: failed to fetch content`, e)
  }

  const xml = buildFeed(
    {
      self: `/feed/${key}.xml`,
      title: cfg.title,
      description: cfg.description,
      explicit: cfg.explicit,
    },
    rows,
  )

  return new Response(xml, { headers: FEED_HEADERS })
}
