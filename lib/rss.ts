/**
 * Складання RSS 2.0 з підтримкою подкаст-тегів (itunes, podcast).
 *
 * Один фід обслуговує дві задачі одночасно:
 *  - звичайна підписка через читалку (Feedly, Inoreader, скрінрідери);
 *  - подача в подкаст-каталоги, коли з'явиться аудіо. Apple Podcasts,
 *    Spotify і Google приймають контент ЛИШЕ через RSS — іншого шляху
 *    немає, тому теги додано наперед, а не «колись потім».
 *
 * Свідомо НЕ віддаємо повний текст твору. У фід іде тільки короткий опис
 * і посилання на сайт: інакше платний контент читався б у читалці повз
 * передплату. Виняток — is_free: там короткий опис теж короткий, просто
 * читач одразу бачить, що заходити безкоштовно.
 *
 * <enclosure> і <itunes:duration> з'являються лише тоді, коли в рядку є
 * audio_url. Порожній enclosure ламає подкаст-валідатори, тож краще без
 * нього, ніж з порожнім.
 */

export const BASE_URL = 'https://balabony.com'

/** Рядок content, з якого будується елемент фіду. */
export type FeedRow = {
  type: string | null
  slug: string | null
  title: string | null
  short_description: string | null
  description: string | null
  hook: string | null
  cover_url: string | null
  author_name: string | null
  published_at: string | null
  approved_at: string | null
  created_at: string | null
  audio_url: string | null
  duration_minutes: number | null
  season_number: number | null
  episode_number: number | null
  is_adult: boolean | null
}

export type Channel = {
  /** Шлях фіду без домену, напр. '/feed.xml'. Потрібен для atom:link rel=self. */
  self: string
  title: string
  description: string
  /** Обкладинка каналу. Apple вимагає квадратну, 1400–3000 px. */
  image?: string
  /** 18+ на рівні каналу. Для «Тиші» — true. */
  explicit?: boolean
}

/** Екранування для тексту всередині XML-вузла. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Прибирає керуючі символи, які роблять XML невалідним. */
function clean(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

function rfc822(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date()
  return (Number.isNaN(d.getTime()) ? new Date() : d).toUTCString()
}

/** Публічна адреса твору — та сама логіка, що в sitemap.ts. */
export function workPath(type: string | null, slug: string): string {
  if (type === 'balabony') return `/episodes/${slug}`
  if (type === 'tysha') return `/tysha/${slug}`
  return `/stories/${slug}`
}

/**
 * Короткий опис твору.
 *
 * preview_text свідомо НЕ використовуємо: це початок самого твору, а не
 * анотація. У фіді він виглядав як опис, і читалка віддавала 400 знаків
 * платного тексту людині, яка навіть не заходила на сайт.
 *
 * hook підходить: це короткий гачок для картки, написаний редакцією,
 * а не шматок тексту. Якщо немає і його — ставимо нейтральний рядок.
 * Порожній <description> частина агрегаторів показує як «(no description)»,
 * що гірше за просту фразу.
 */
function summary(r: FeedRow): string {
  const raw = r.short_description || r.description || r.hook || ''
  const t = clean(raw).replace(/\s+/g, ' ').trim()
  if (!t) return 'Читати на Балабонах'
  if (t.length <= 400) return t
  return t.slice(0, 397).trimEnd() + '…'
}

function item(r: FeedRow): string {
  if (!r.slug) return ''

  const url = `${BASE_URL}${workPath(r.type, r.slug)}`
  const title = clean(r.title || 'Без назви').trim()
  const descr = summary(r)
  const date = rfc822(r.published_at || r.approved_at || r.created_at)
  const parts: string[] = []

  parts.push(`      <title>${esc(title)}</title>`)
  parts.push(`      <link>${esc(url)}</link>`)
  parts.push(`      <guid isPermaLink="true">${esc(url)}</guid>`)
  parts.push(`      <pubDate>${date}</pubDate>`)
  if (descr) {
    parts.push(`      <description>${esc(descr)}</description>`)
    parts.push(`      <itunes:summary>${esc(descr)}</itunes:summary>`)
  }
  if (r.author_name) {
    parts.push(`      <itunes:author>${esc(clean(r.author_name))}</itunes:author>`)
  }
  if (r.cover_url) {
    parts.push(`      <itunes:image href="${esc(r.cover_url)}"/>`)
  }
  if (r.season_number != null) {
    parts.push(`      <itunes:season>${r.season_number}</itunes:season>`)
  }
  if (r.episode_number != null) {
    parts.push(`      <itunes:episode>${r.episode_number}</itunes:episode>`)
  }
  parts.push(`      <itunes:explicit>${r.is_adult ? 'true' : 'false'}</itunes:explicit>`)

  // Аудіо з'явиться пізніше — теги додаються самі, коли заповниться audio_url.
  if (r.audio_url) {
    parts.push(`      <enclosure url="${esc(r.audio_url)}" type="audio/mpeg" length="0"/>`)
    if (r.duration_minutes) {
      parts.push(`      <itunes:duration>${Math.round(r.duration_minutes * 60)}</itunes:duration>`)
    }
  }

  return `    <item>\n${parts.join('\n')}\n    </item>`
}

export function buildFeed(ch: Channel, rows: FeedRow[]): string {
  const items = rows.map(item).filter(Boolean).join('\n')
  const now = new Date().toUTCString()
  const image = ch.image ?? `${BASE_URL}/cover-default.png`

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(ch.title)}</title>
    <link>${BASE_URL}</link>
    <description>${esc(ch.description)}</description>
    <language>uk</language>
    <copyright>© ${new Date().getFullYear()} Балабони</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>balabony.com</generator>
    <atom:link href="${esc(BASE_URL + ch.self)}" rel="self" type="application/rss+xml"/>
    <itunes:author>Балабони</itunes:author>
    <itunes:summary>${esc(ch.description)}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>${ch.explicit ? 'true' : 'false'}</itunes:explicit>
    <itunes:owner>
      <itunes:name>Балабони</itunes:name>
      <itunes:email>nazar@balabony.com</itunes:email>
    </itunes:owner>
    <itunes:image href="${esc(image)}"/>
    <itunes:category text="Arts">
      <itunes:category text="Books"/>
    </itunes:category>
    <image>
      <url>${esc(image)}</url>
      <title>${esc(ch.title)}</title>
      <link>${BASE_URL}</link>
    </image>
${items}
  </channel>
</rss>
`
}

/** Заголовки відповіді. Кеш на 30 хвилин — фід не мусить бути секундним. */
export const FEED_HEADERS = {
  'Content-Type': 'application/rss+xml; charset=utf-8',
  'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
}

/** Поля, які тягнемо з content. Виніс окремо, щоб не розходились між маршрутами. */
export const FEED_SELECT =
  'type, slug, title, short_description, description, hook, cover_url, ' +
  'author_name, published_at, approved_at, created_at, audio_url, duration_minutes, ' +
  'season_number, episode_number, is_adult'
