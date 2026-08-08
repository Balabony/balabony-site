import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import AudioPlayer from '@/app/components/AudioPlayer'
import { ThemeProvider } from '@/app/context/ThemeContext'
import FreshStoriesGrid, { type Story } from '@/app/components/FreshStoriesGrid'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import ShareButtons from '@/app/components/ShareButtons'
import { toExcerpt } from '@/lib/plain-text'
import { pickPublishedText } from '@/lib/published-text'
import { authorSlug } from '@/lib/author-slug'

/**
 * Публічна сторінка автора: /avtor/[slug]
 *
 * Автор поширює це посилання сам, і воно ж стоїть за QR-кодом у газеті.
 * Тому сторінка має бути стабільною: slug рахується з display_name,
 * і поки ім'я не змінюється, посилання лишається чинним.
 *
 * Тексти беруться за author_id (прив'язка через /admin/link-authors),
 * а не за збігом імені: інакше однофамілець забрав би чужі твори.
 * Для авторів, чиї архівні тексти ще не прив'язані, показуємо порожньо —
 * це видно адміну в списку прив'язки і виправляється там.
 */

interface ProfileRow {
  user_id: string
  display_name: string | null
  pen_name: string | null
  bio: string | null
}

interface StoryRow {
  id: string
  slug: string
  type: string | null
  title: string
  author_name: string
  genre: string | null
  text: string
  corrected_text: string | null
  humanized_text: string | null
  published_version: string | null
  cover_url: string | null
  cover_position: string | null
  episode_number: number | null
  is_adult: boolean | null
  approved_at: string
}

async function getProfile(slug: string): Promise<ProfileRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('author_profiles')
    .select('user_id, display_name, pen_name, bio')
    .eq('is_active', true)

  if (error || !data) return null

  const match = (data as ProfileRow[]).find((p) => {
    const name = p.pen_name?.trim() || p.display_name?.trim() || ''
    return name !== '' && authorSlug(name) === slug
  })

  return match ?? null
}

/**
 * Куди веде картка твору.
 *
 * Серіали живуть на власних маршрутах, і якщо всі посилання гнати на
 * /stories, читач отримає 404 рівно на тому кліку, заради якого автор
 * і поширював сторінку.
 */
function workUrl(type: string | null, slug: string): string {
  if (type === 'balabony') return `/episodes/${slug}`
  if (type === 'tysha') return `/tysha/${slug}`
  return `/stories/${slug}`
}

/**
 * Сумарні вподобання всіх творів автора.
 *
 * Рахуємо на боці бази (head: true). Тягнути рядки і рахувати їх у коді
 * не можна: Supabase мовчки віддає максимум 1000 і цифра застрягла б.
 */
async function getLikesTotal(contentIds: string[]): Promise<number> {
  if (contentIds.length === 0) return 0
  const supabase = getSupabaseAdmin()
  const { count, error } = await supabase
    .from('content_likes')
    .select('*', { count: 'exact', head: true })
    .in('content_id', contentIds)
  if (error) return 0
  return count ?? 0
}

/**
 * Твори автора, розкладені по типах.
 *
 * Одна спільна сітка тут не працює: у Назара Колодія «Балабони» — теплий
 * сільський гумор, а «Тиша» — військова драма 18+. Поруч у одному ряду вони
 * читаються як помилка, і читач, що прийшов за одним, натрапляє на інше.
 */
interface WorkGroup {
  key: string
  label: string
  note: string
  stories: Story[]
}

const GROUP_META: Record<string, { label: string; note: string; order: number }> = {
  balabony: { label: 'Серіал «Балабони»', note: 'Сільські історії з гумором', order: 1 },
  story:    { label: 'Історії',           note: '',                          order: 2 },
  tysha:    { label: 'Серіал «Тиша» 18+', note: 'Військова драма для дорослих', order: 3 },
}

async function getWorks(userId: string): Promise<{ groups: WorkGroup[]; total: number; ids: string[] }> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('id, slug, type, title, author_name, genre, text, corrected_text, humanized_text, published_version, cover_url, cover_position, is_adult, approved_at, episode_number')
    .eq('author_id', userId)
    .in('status', ['approved', 'published'])
    .order('approved_at', { ascending: false })
    .order('episode_number', { ascending: true, nullsFirst: false })

  if (error || !data) return { groups: [], total: 0, ids: [] }

  const rows = data as StoryRow[]
  const byType = new Map<string, Story[]>()

  for (const s of rows) {
    const key = s.type === 'balabony' || s.type === 'tysha' ? s.type : 'story'
    const list = byType.get(key) ?? []
    list.push({
      id: s.slug,
      title: s.title,
      author: s.author_name,
      coverUrl: s.cover_url ?? '/og-image.jpg',
      // Кадр, налаштований в /admin/cover-position. Без нього сітка
      // ставить center і зрізає голови на портретних обкладинках.
      coverPosition: s.cover_position ?? undefined,
      tags: [],
      hasAudio: false,
      teaser: toExcerpt(pickPublishedText(s), 200),
      url: workUrl(s.type, s.slug),
      genre: s.genre ?? undefined,
      isAdult: s.type === 'tysha' ? true : (s.is_adult ?? false),
    })
    byType.set(key, list)
  }

  // Серіали — за номером серії від першої; окремі історії лишаються
  // за датою, там нумерації немає.
  const orderByEpisode = (key: string) => key === 'balabony' || key === 'tysha'
  const episodeOf = new Map<string, number>()
  for (const r of rows) {
    if (r.episode_number != null) episodeOf.set(r.slug, r.episode_number)
  }

  for (const [key, list] of byType.entries()) {
    if (!orderByEpisode(key)) continue
    list.sort((a, b) => (episodeOf.get(a.id) ?? 1e9) - (episodeOf.get(b.id) ?? 1e9))
  }

  const groups: WorkGroup[] = Array.from(byType.entries())
    .map(([key, stories]) => ({
      key,
      label: GROUP_META[key]?.label ?? 'Історії',
      note: GROUP_META[key]?.note ?? '',
      stories,
    }))
    .sort((a, b) => (GROUP_META[a.key]?.order ?? 9) - (GROUP_META[b.key]?.order ?? 9))

  return { groups, total: rows.length, ids: rows.map((s) => s.id) }
}

/** «7 вподобань», «2 вподобання», «1 вподобання» */
function pluralLikes(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return `${n} вподобань`
  if (mod10 === 1) return `${n} вподобання`
  if (mod10 >= 2 && mod10 <= 4) return `${n} вподобання`
  return `${n} вподобань`
}

function displayName(p: ProfileRow): string {
  return p.pen_name?.trim() || p.display_name?.trim() || 'Автор'
}

/** «7 історій», «2 історії», «1 історія» */
function pluralWorks(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return `${n} історій`
  if (mod10 === 1) return `${n} історія`
  if (mod10 >= 2 && mod10 <= 4) return `${n} історії`
  return `${n} історій`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const profile = await getProfile(slug)
  if (!profile) return { title: 'Автора не знайдено — Балабони' }

  const name = displayName(profile)
  const title = `${name} — автор на Балабонах`
  const description = profile.bio?.trim()
    ? toExcerpt(profile.bio, 160)
    : `Історії автора ${name} на платформі Балабони. Читати українською.`

  return {
    title,
    description,
    alternates: { canonical: `/avtor/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://balabony.com/avtor/${slug}`,
      type: 'profile',
      images: ['/og-image.jpg'],
    },
  }
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = await getProfile(slug)
  if (!profile) notFound()

  const name = displayName(profile)
  const { groups, total, ids } = await getWorks(profile.user_id)
  const likesTotal = await getLikesTotal(ids)

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: 'Автори', href: '/stories' }, { label: name }]} />

        <header style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: '"Comfortaa", sans-serif',
              fontSize: 32,
              margin: '0 0 8px',
              color: 'var(--accent-gold)',
            }}
          >
            {name}
          </h1>

          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 14,
              color: '#94a3b8',
              margin: 0,
            }}
          >
            {total > 0 ? pluralWorks(total) + ' на Балабонах' : 'Автор Балабонів'}
            {likesTotal > 0 && (
              <>
                {' · '}
                <span style={{ color: 'var(--accent-gold)' }} aria-hidden>♥</span>{' '}
                {pluralLikes(likesTotal)}
              </>
            )}
          </p>

          {profile.bio?.trim() && (
            <p
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 16,
                lineHeight: 1.7,
                color: '#cbd5e1',
                margin: '16px 0 0',
                maxWidth: 720,
              }}
            >
              {profile.bio}
            </p>
          )}

          <div style={{ marginTop: 20 }}>
            <ShareButtons
              url={`https://balabony.com/avtor/${slug}`}
              title={`${name} — автор на Балабонах`}
            />
          </div>
        </header>

        {total === 0 ? (
          <p
            style={{
              fontFamily: "'Montserrat', sans-serif",
              color: '#94a3b8',
              fontSize: 16,
            }}
          >
            Історії цього автора скоро зʼявляться.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {groups.map((g) => (
              <section key={g.key}>
                <h2
                  style={{
                    fontFamily: '"Comfortaa", sans-serif',
                    fontSize: 22,
                    color: 'var(--accent-gold)',
                    margin: '0 0 4px',
                  }}
                >
                  {g.label}
                </h2>
                {g.note && (
                  <p
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 13,
                      color: '#94a3b8',
                      margin: '0 0 16px',
                    }}
                  >
                    {g.note} · {pluralWorks(g.stories.length)}
                  </p>
                )}
                <FreshStoriesGrid stories={g.stories} showHeading={false} />
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
