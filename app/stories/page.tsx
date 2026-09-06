import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import type { Story } from '../components/FreshStoriesGrid'
import StoriesPaged from '../components/StoriesPaged'
import Breadcrumbs from '../components/Breadcrumbs'
import { toExcerpt } from '@/lib/plain-text'
import { redirect } from 'next/navigation'
import { normalizeGenre, GENRE_PAGES } from '@/lib/genres'

/**
 * Сторінка перебудовується сама з бази, без деплою: перший відвідувач після
 * закінчення терміну отримує стару версію, Next.js у фоні збирає свіжу.
 * Нові твори авторів зʼявляються протягом чверті години.
 */
export const revalidate = 900

export const metadata: Metadata = {
  title: 'Історії читачів — Балабони',
  description: 'Реальні історії читачів Балабонів: казки, життєві історії, особисті спогади. Українською мовою.',
  alternates: { canonical: '/stories' },
  openGraph: {
    title: 'Історії читачів — Балабони',
    description: 'Реальні історії читачів Балабонів: казки, життєві історії, особисті спогади.',
    url: 'https://balabony.com/stories',
    type: 'website',
  },
}

interface StoryRow {
  slug: string
  title: string
  author_name: string
  genre: string | null
  /** Готовий уривок із бази. Повні тексти сюди не тягнемо: 908 творів —
   *  це 10 МБ за запит, чого сторінка не витримувала. */
  preview_text: string | null
  cover_url: string | null
  cover_position: string | null
  duration_minutes: number | null
  category: string | null
  is_adult: boolean | null
}

// Старі/англомовні посилання → канонічний жанр у базі
const GENRE_ALIASES: Record<string, string> = {
  fairytale: 'Казка',
  fairytales: 'Казка',
  kazka: 'Казка',
  kazky: 'Казка',
}

// Гарна назва для заголовка сторінки (множина), якщо відома
const GENRE_DISPLAY: Record<string, string> = {
  казка: 'Казки',
}

function normalize(v: string): string {
  return v.trim().toLowerCase()
}

function resolveGenre(raw?: string | string[]): string | null {
  const first = Array.isArray(raw) ? raw[0] : raw
  if (!first) return null
  const trimmed = first.trim()
  if (!trimmed) return null
  return GENRE_ALIASES[normalize(trimmed)] ?? trimmed
}

/** Дата, за якою твір стає в чергу показу. approved_at заповнений не всюди
 *  (твори, додані повз редакторський потік, лишаються з порожнім полем і
 *  провалюються в кінець списку), тому беремо першу наявну з трьох. */
function sortDate(s: { published_at: string | null; approved_at: string | null; created_at: string }): number {
  return new Date(s.published_at ?? s.approved_at ?? s.created_at).getTime()
}

async function getStories(): Promise<Story[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, author_name, genre, preview_text, cover_url, cover_position, duration_minutes, category, published_at, approved_at, created_at, is_adult')
    .eq('type', 'story')
    .in('status', ['approved', 'published'])
  if (error || !data) return []
  const rows = data as (StoryRow & {
    published_at: string | null
    approved_at: string | null
    created_at: string
  })[]
  rows.sort((a, b) => sortDate(b) - sortDate(a))
  return rows.map((s) => ({
    id: s.slug,
    title: s.title,
    author: s.author_name,
    coverUrl: s.cover_url ?? '/og-image.jpg',
    coverPosition: s.cover_position ?? undefined,
    tags: [],
    hasAudio: false,
    teaser: toExcerpt(s.preview_text, 200),
    url: `/stories/${s.slug}`,
    genre: s.genre ?? undefined,
    duration_minutes: s.duration_minutes ?? undefined,
    category: s.category ?? undefined,
    isAdult: s.is_adult ?? false,
  }))
}

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string | string[] }>
}) {
  const { genre } = await searchParams

  // Старі посилання з параметром ведемо на власну сторінку жанру. Дві адреси
  // з однаковим вмістом ділять між собою вагу в пошуку, тож лишаємо одну.
  const canonicalGenre = normalizeGenre(Array.isArray(genre) ? genre[0] : genre)
  if (canonicalGenre) redirect(`/stories/zhanr/${GENRE_PAGES[canonicalGenre].slug}`)

  const activeGenre = resolveGenre(genre)

  const allStories = await getStories()
  const stories = activeGenre
    ? allStories.filter((s) => normalize(s.genre ?? '') === normalize(activeGenre))
    : allStories.filter((s) => normalize(s.genre ?? '') !== 'казка')

  const heading = activeGenre
    ? GENRE_DISPLAY[normalize(activeGenre)] ?? activeGenre
    : 'Історії читачів'

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: heading }]} />
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 24, color: 'var(--accent-gold)' }}>
          {heading}
        </h1>

        {activeGenre && (
          <a
            href="/stories"
            style={{
              display: 'inline-block',
              marginBottom: 20,
              color: '#94a3b8',
              fontSize: 14,
              textDecoration: 'none',
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            ← Усі історії
          </a>
        )}

        {stories.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>
            {activeGenre ? 'Історій у цьому жанрі поки немає.' : 'Історій поки немає.'}
          </p>
        ) : (
          <StoriesPaged stories={stories} />
        )}
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
