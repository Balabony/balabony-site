import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import { ThemeProvider } from '@/app/context/ThemeContext'
import { authorSlug } from '@/lib/author-slug'

/**
 * Публічний список авторів: /avtory
 *
 * До цієї сторінки на авторський профіль не було як потрапити з сайту —
 * посилання існувало, але нікуди не вело з навігації. Тут воно і живе.
 *
 * Показуємо ЛИШЕ авторів, у яких є хоч один опублікований твір. Автор
 * без творів — це порожня сторінка, на яку не варто вести читача, і
 * заразом це страхує від публікації тих, чиї тексти ще не пройшли
 * перевірку згоди: немає опублікованого твору — немає й картки.
 */

export const revalidate = 300

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const FONT = "'Montserrat', Arial, sans-serif"

export const metadata: Metadata = {
  title: 'Автори Балабонів — українські письменники',
  description:
    'Автори платформи Балабони: українські письменники, чиї історії читають тисячі людей. Сторінка кожного автора з добіркою творів.',
  alternates: { canonical: '/avtory' },
  openGraph: {
    title: 'Автори Балабонів',
    description: 'Українські письменники, чиї історії читають на Балабонах.',
    url: 'https://balabony.com/avtory',
    images: ['/og-image.jpg'],
  },
}

interface ProfileRow {
  user_id: string
  display_name: string | null
  pen_name: string | null
  bio: string | null
}

interface AuthorCard {
  slug: string
  name: string
  bio: string
  works: number
  likes: number
}

function displayName(p: ProfileRow): string {
  return p.pen_name?.trim() || p.display_name?.trim() || ''
}

function pluralWorks(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return `${n} історій`
  if (mod10 === 1) return `${n} історія`
  if (mod10 >= 2 && mod10 <= 4) return `${n} історії`
  return `${n} історій`
}

/** Перші літери імені та прізвища — замість фото, якого поки немає. */
function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

function shortBio(bio: string | null): string {
  const t = (bio ?? '').trim().replace(/\s+/g, ' ')
  if (t.length <= 140) return t
  return t.slice(0, 137).trimEnd() + '…'
}

/**
 * Supabase мовчки віддає максимум 1000 рядків. Творів і лайків може бути
 * більше, тому читаємо сторінками — інакше автори в хвості списку назавжди
 * лишились би з нулями.
 */
async function allWorks(): Promise<{ id: string; author_id: string }[]> {
  const supabase = getSupabaseAdmin()
  const out: { id: string; author_id: string }[] = []
  const step = 1000

  for (let from = 0; from < 100_000; from += step) {
    const { data, error } = await supabase
      .from('content')
      .select('id, author_id')
      .eq('type', 'story')
      .in('status', ['approved', 'published'])
      .not('author_id', 'is', null)
      .range(from, from + step - 1)

    if (error || !data) break
    out.push(...(data as { id: string; author_id: string }[]))
    if (data.length < step) break
  }

  return out
}

async function allLikes(): Promise<Map<string, number>> {
  const supabase = getSupabaseAdmin()
  const counts = new Map<string, number>()
  const step = 1000

  for (let from = 0; from < 200_000; from += step) {
    const { data, error } = await supabase
      .from('content_likes')
      .select('content_id')
      .range(from, from + step - 1)

    // Таблиці може ще не бути на момент першого деплою — це не привід
    // ламати всю сторінку, просто лишаємось без лічильника.
    if (error || !data) break
    for (const r of data as { content_id: string }[]) {
      counts.set(r.content_id, (counts.get(r.content_id) ?? 0) + 1)
    }
    if (data.length < step) break
  }

  return counts
}

async function getAuthors(): Promise<AuthorCard[]> {
  const supabase = getSupabaseAdmin()

  const { data: profileData, error } = await supabase
    .from('author_profiles')
    .select('user_id, display_name, pen_name, bio')
    .eq('is_active', true)

  if (error || !profileData) return []
  const profiles = profileData as ProfileRow[]

  const works = await allWorks()
  const likesByContent = await allLikes()

  const worksByAuthor = new Map<string, string[]>()
  for (const w of works) {
    const list = worksByAuthor.get(w.author_id) ?? []
    list.push(w.id)
    worksByAuthor.set(w.author_id, list)
  }

  const cards: AuthorCard[] = []

  for (const p of profiles) {
    const name = displayName(p)
    if (!name) continue

    const ids = worksByAuthor.get(p.user_id) ?? []
    // Автор без опублікованих творів — це порожня сторінка. Не ведемо туди.
    if (ids.length === 0) continue

    cards.push({
      slug: authorSlug(name),
      name,
      bio: shortBio(p.bio),
      works: ids.length,
      likes: ids.reduce((sum, id) => sum + (likesByContent.get(id) ?? 0), 0),
    })
  }

  cards.sort((a, b) => b.works - a.works || a.name.localeCompare(b.name, 'uk'))
  return cards
}

export default async function AuthorsPage() {
  const authors = await getAuthors()

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 72px' }}>
        <Breadcrumbs items={[{ label: 'Автори' }]} />

        <header style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: '"Comfortaa", sans-serif',
              fontSize: 32,
              margin: '0 0 10px',
              color: GOLD,
            }}
          >
            Автори Балабонів
          </h1>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 16,
              lineHeight: 1.7,
              color: '#cbd5e1',
              margin: 0,
              maxWidth: 720,
            }}
          >
            Українські письменники, чиї історії читають на платформі. У кожного —
            власна сторінка з добіркою творів.
          </p>
        </header>

        {authors.length === 0 ? (
          <p style={{ fontFamily: FONT, color: '#94a3b8', fontSize: 16 }}>
            Список авторів зʼявиться найближчим часом.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 18,
            }}
          >
            {authors.map((a) => (
              <a
                key={a.slug}
                href={`/avtor/${a.slug}`}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  padding: '18px 18px',
                  background: '#0f1e3a',
                  border: '1px solid rgba(239,159,39,0.35)',
                  borderRadius: 14,
                  textDecoration: 'none',
                  color: 'inherit',
                  minHeight: 96,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(239,159,39,0.16)',
                    border: `1px solid ${GOLD}66`,
                    color: GOLD,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT,
                    fontSize: 17,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {initials(a.name)}
                </span>

                <span style={{ display: 'block', minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: FONT,
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#f5f0e8',
                      marginBottom: 4,
                    }}
                  >
                    {a.name}
                  </span>

                  <span
                    style={{
                      display: 'block',
                      fontFamily: FONT,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#94a3b8',
                      marginBottom: a.bio ? 7 : 0,
                    }}
                  >
                    {pluralWorks(a.works)}
                    {a.likes > 0 && (
                      <>
                        {' · '}
                        <span style={{ color: GOLD }} aria-hidden>♥</span> {a.likes}
                      </>
                    )}
                  </span>

                  {a.bio && (
                    <span
                      style={{
                        display: 'block',
                        fontFamily: FONT,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: '#cbd5e1',
                      }}
                    >
                      {a.bio}
                    </span>
                  )}
                </span>
              </a>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </ThemeProvider>
  )
}
