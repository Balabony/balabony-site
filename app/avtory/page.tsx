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
 *
 * Рахуємо всі типи, а не лише окремі історії: автор серіалу — теж автор,
 * і з фільтром по type='story' він просто зникав зі списку власної
 * платформи.
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
  avatar_url: string | null
  hide_from_directory: boolean | null
}

interface BoardRow {
  author_id: string
  reads_completed: number
  reads_total: number
  avg_percentage: number
}

interface BoardEntry {
  slug: string
  name: string
  value: string
}

interface AuthorCard {
  userId: string
  avatar: string | null
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

/**
 * Дошки за останні 30 днів.
 *
 * Рахуємо дочитування, а не лайки: лайк анонімний і накручується очищенням
 * браузера, а прочитання пишеться лише авторизованому читачеві й лише після
 * 70% тексту. Публічний рейтинг на лайках посварив би авторів між собою.
 *
 * Період, а не весь час: інакше автор зі ста архівними текстами був би
 * першим назавжди, і рейтинг перестав би щось означати для решти.
 */
async function getBoards(
  nameById: Map<string, { slug: string; name: string }>,
): Promise<{ mostRead: BoardEntry[]; bestDepth: BoardEntry[] }> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('author_month_stats')
    .select('author_id, reads_completed, reads_total, avg_percentage')

  if (error || !data) return { mostRead: [], bestDepth: [] }

  const rows = (data as BoardRow[]).filter((r) => nameById.has(r.author_id))

  const mostRead = rows
    .filter((r) => r.reads_completed > 0)
    .sort((a, b) => b.reads_completed - a.reads_completed)
    .slice(0, 10)
    .map((r) => {
      const p = nameById.get(r.author_id)!
      return { slug: p.slug, name: p.name, value: `${r.reads_completed}` }
    })

  // Поріг обовʼязковий: без нього перемагає той, чию єдину історію
  // дочитали двічі зі ста відсотками, і дошка стає посміховиськом.
  const bestDepth = rows
    .filter((r) => r.reads_total >= 30)
    .sort((a, b) => b.avg_percentage - a.avg_percentage)
    .slice(0, 5)
    .map((r) => {
      const p = nameById.get(r.author_id)!
      return { slug: p.slug, name: p.name, value: `${r.avg_percentage}%` }
    })

  return { mostRead, bestDepth }
}

async function getAuthors(): Promise<AuthorCard[]> {
  const supabase = getSupabaseAdmin()

  const { data: profileData, error } = await supabase
    .from('author_profiles')
    .select('user_id, display_name, pen_name, bio, avatar_url, hide_from_directory')
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
    // Прапорець у базі, а не список імен у коді: сховати треба не лише
    // засновника — редакційні акаунти й автори, які просили не показувати
    // їх публічно, керуються тим самим перемикачем.
    if (p.hide_from_directory) continue

    const name = displayName(p)
    if (!name) continue

    const ids = worksByAuthor.get(p.user_id) ?? []
    // Автор без опублікованих творів — це порожня сторінка. Не ведемо туди.
    if (ids.length === 0) continue

    cards.push({
      userId: p.user_id,
      avatar: p.avatar_url,
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

/** Одна дошка: нумерований список із посиланнями на авторів. */
function Board({
  title,
  note,
  unit,
  entries,
}: {
  title: string
  note: string
  unit: string
  entries: BoardEntry[]
}) {
  if (entries.length === 0) return null

  return (
    <div
      style={{
        flex: '1 1 300px',
        padding: '18px 20px',
        background: '#0f1e3a',
        border: '1px solid rgba(239,159,39,0.3)',
        borderRadius: 14,
      }}
    >
      <h2
        style={{
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 700,
          color: GOLD,
          margin: '0 0 4px',
          letterSpacing: 0.3,
        }}
      >
        {title}
      </h2>
      <p style={{ fontFamily: FONT, fontSize: 12, color: '#94a3b8', margin: '0 0 14px' }}>
        {note}
      </p>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {entries.map((e, i) => (
          <li
            key={e.slug}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              padding: '7px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(143,163,196,0.14)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 20,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 700,
                color: i < 3 ? GOLD : '#64748b',
              }}
            >
              {i + 1}
            </span>
            <a
              href={`/avtor/${e.slug}`}
              style={{
                flex: 1,
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 600,
                color: '#f5f0e8',
                textDecoration: 'none',
                minWidth: 0,
              }}
            >
              {e.name}
            </a>
            <span
              style={{
                flexShrink: 0,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 700,
                color: GOLD,
              }}
            >
              {e.value}
              <span style={{ color: '#94a3b8', fontWeight: 500 }}> {unit}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default async function AuthorsPage() {
  const authors = await getAuthors()

  const nameById = new Map<string, { slug: string; name: string }>()
  for (const a of authors) nameById.set(a.userId, { slug: a.slug, name: a.name })
  const boards = await getBoards(nameById)

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

        {(boards.mostRead.length > 0 || boards.bestDepth.length > 0) && (
          <section style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 34 }}>
            <Board
              title="Найчитаніші за місяць"
              note="Скільки історій дочитали до кінця за останні 30 днів"
              unit="дочитувань"
              entries={boards.mostRead}
            />
            <Board
              title="Найкраще дочитують"
              note="Середня глибина читання, від 30 прочитань за місяць"
              unit=""
              entries={boards.bestDepth}
            />
          </section>
        )}

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
                {a.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={a.avatar}
                    alt=""
                    style={{
                      flexShrink: 0,
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `1px solid ${GOLD}66`,
                    }}
                  />
                ) : (
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
                )}

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
