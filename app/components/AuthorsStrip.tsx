import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { authorSlug } from '@/lib/author-slug'

/**
 * Рядок «Наші автори» на головній.
 *
 * Показуємо тільки тих, хто:
 *   — активний (is_active),
 *   — не сховався перемикачем hide_from_directory,
 *   — має щонайменше один опублікований твір (порожня сторінка автора —
 *     гірше, ніж відсутність автора у стрічці).
 *
 * Порядок — щоденна ротація тим самим механізмом, що у «Свіжих історіях»:
 * номер доби зсуває вікно, тому щодня на головній інші обличчя, і це
 * детерміновано (усі відвідувачі за добу бачать однакове, кеш працює).
 *
 * Фото показуємо, коли воно є; інакше — золотий кружок з ініціалами.
 */

const FONT = "'Montserrat', sans-serif"
const GOLD = '#EF9F27'
const GOLD_LIGHT = '#FAC775'
const CREAM = '#FFF8EE'

type ProfileRow = {
  user_id: string
  display_name: string | null
  pen_name: string | null
  avatar_url: string | null
  hide_from_directory: boolean | null
}

type Card = { slug: string; name: string; avatar: string | null; initials: string }

function displayName(p: ProfileRow): string {
  return p.pen_name?.trim() || p.display_name?.trim() || ''
}

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
}

async function getAuthors(limit: number): Promise<Card[]> {
  const supabase = getSupabaseAdmin()

  const { data: profileData, error } = await supabase
    .from('author_profiles')
    .select('user_id, display_name, pen_name, avatar_url, hide_from_directory')
    .eq('is_active', true)

  if (error || !profileData) return []
  const profiles = profileData as ProfileRow[]

  // Автори, у яких є хоч один опублікований твір. Тягнемо сторінками:
  // Supabase мовчки віддає максимум 1000 рядків.
  const withWorks = new Set<string>()
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error: wErr } = await supabase
      .from('content')
      .select('author_id')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .not('author_id', 'is', null)
      .range(from, from + PAGE - 1)
    if (wErr || !data || data.length === 0) break
    for (const r of data as { author_id: string | null }[]) {
      if (r.author_id) withWorks.add(r.author_id)
    }
    if (data.length < PAGE) break
  }

  const all: Card[] = []
  for (const p of profiles) {
    if (p.hide_from_directory) continue
    if (!withWorks.has(p.user_id)) continue
    const name = displayName(p)
    if (!name) continue
    all.push({
      slug: authorSlug(name),
      name,
      avatar: p.avatar_url,
      initials: initialsOf(name),
    })
  }

  if (all.length === 0) return []

  // Стабільний порядок, щоб зсув був передбачуваний.
  all.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))

  const day = Math.floor(Date.now() / 86400000)
  const start = ((day * limit) % all.length + all.length) % all.length
  const out: Card[] = []
  for (let i = 0; i < Math.min(limit, all.length); i++) {
    out.push(all[(start + i) % all.length])
  }
  return out
}

export default async function AuthorsStrip({ limit = 8 }: { limit?: number }) {
  const authors = await getAuthors(limit)
  if (authors.length === 0) return null

  return (
    <section
      aria-labelledby="authors-strip-title"
      style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 20px 28px', fontFamily: FONT }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: 12 }}>
          <h2
            id="authors-strip-title"
            style={{
              fontFamily: "'Lora', serif",
              fontWeight: 600,
              fontSize: 21,
              color: GOLD_LIGHT,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Наші автори
          </h2>
          <p style={{ fontSize: 12, color: '#C08A2E', margin: '3px 0 0', lineHeight: 1.25 }}>
            люди, які пишуть для Balabony
          </p>
        </div>
        <Link
          href="/avtory"
          style={{
            fontSize: 12,
            color: GOLD,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          усі автори →
        </Link>
      </div>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
          gap: 12,
        }}
      >
        {authors.map(a => (
          <li key={a.slug} style={{ minWidth: 0 }}>
            <Link
              href={`/avtory/${a.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: a.avatar ? '#17273D' : 'rgba(239,159,39,0.12)',
                  border: `1.5px solid ${a.avatar ? 'rgba(239,159,39,0.45)' : GOLD}`,
                }}
              >
                {a.avatar ? (
                  // Звичайний img: аватарки роздаються з Supabase Storage,
                  // next/image тут дав би зайві трансформації без користі.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.avatar}
                    alt=""
                    width={72}
                    height={72}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <span style={{ fontSize: 22, fontWeight: 700, color: GOLD_LIGHT }}>
                    {a.initials}
                  </span>
                )}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: CREAM,
                  textAlign: 'center',
                  lineHeight: 1.25,
                  minWidth: 0,
                }}
              >
                {a.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
