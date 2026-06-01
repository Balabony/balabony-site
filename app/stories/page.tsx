import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import FreshStoriesGrid, { type Story } from '../components/FreshStoriesGrid'
import Breadcrumbs from '../components/Breadcrumbs'

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
  text: string
  cover_url: string | null
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

async function getStories(): Promise<Story[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, author_name, genre, text, cover_url, approved_at')
    .eq('type', 'story')
    .in('status', ['approved', 'published'])
    .order('approved_at', { ascending: false })
  if (error || !data) return []
  return (data as (StoryRow & { approved_at: string })[]).map((s) => ({
    id: s.slug,
    title: s.title,
    author: s.author_name,
    coverUrl: s.cover_url ?? '/og-image.jpg',
    tags: [],
    hasAudio: false,
    teaser: s.text.replace(/\s+/g, ' ').slice(0, 200),
    url: `/stories/${s.slug}`,
    genre: s.genre ?? undefined,
  }))
}

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string | string[] }>
}) {
  const { genre } = await searchParams
  const activeGenre = resolveGenre(genre)

  const allStories = await getStories()
  const stories = activeGenre
    ? allStories.filter((s) => normalize(s.genre ?? '') === normalize(activeGenre))
    : allStories

  const heading = activeGenre
    ? GENRE_DISPLAY[normalize(activeGenre)] ?? activeGenre
    : 'Історії читачів'

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: heading }]} />
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 24, color: '#F5A623' }}>
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
          <FreshStoriesGrid stories={stories} />
        )}
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
