import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import AudioPlayer from '../../../components/AudioPlayer'
import { ThemeProvider } from '../../../context/ThemeContext'
import type { Story } from '../../../components/FreshStoriesGrid'
import StoriesPaged from '../../../components/StoriesPaged'
import Breadcrumbs from '../../../components/Breadcrumbs'
import { toExcerpt } from '@/lib/plain-text'
import { GENRES, GENRE_PAGES, genreBySlug } from '@/lib/genres'

/**
 * Сторінка одного жанру: /stories/zhanr/humor
 *
 * Навіщо окрема адреса, коли фільтр /stories?genre=Гумор уже працює:
 * параметр запиту пошуковики індексують неохоче й часто зводять усі такі
 * адреси до однієї канонічної. Тобто скільки б жанрів не було, у видачі
 * лишалася б одна сторінка «Історії». Окрема адреса дає кожному жанру
 * власний заголовок, опис і місце в карті сайту.
 *
 * Слово «zhanr» у шляху не зайве: історії живуть за адресою
 * /stories/letimo, і без роздільника пошуковик плутав би сторінку жанру
 * зі сторінкою твору.
 */

export const revalidate = 900

/** Усі дев'ять сторінок збираються наперед — їх мало і вони рідко змінюються. */
export function generateStaticParams() {
  return GENRES.map((g) => ({ slug: GENRE_PAGES[g].slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const genre = genreBySlug(slug)
  if (!genre) return { title: 'Історії — Балабони' }

  const page = GENRE_PAGES[genre]
  const url = `https://balabony.com/stories/zhanr/${page.slug}`
  return {
    title: `${page.title} — читати онлайн українською | Балабони`,
    description: page.description,
    alternates: { canonical: `/stories/zhanr/${page.slug}` },
    openGraph: {
      title: `${page.title} — Балабони`,
      description: page.description,
      url,
      type: 'website',
    },
  }
}

interface StoryRow {
  slug: string
  title: string
  author_name: string
  genre: string | null
  preview_text: string | null
  cover_url: string | null
  cover_position: string | null
  duration_minutes: number | null
  category: string | null
  is_adult: boolean | null
  published_at: string | null
  approved_at: string | null
  created_at: string
}

/** approved_at заповнений не всюди, тому беремо першу наявну з трьох дат. */
function sortDate(s: { published_at: string | null; approved_at: string | null; created_at: string }): number {
  return new Date(s.published_at ?? s.approved_at ?? s.created_at).getTime()
}

async function getStoriesByGenre(genre: string): Promise<Story[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, author_name, genre, preview_text, cover_url, cover_position, duration_minutes, category, published_at, approved_at, created_at, is_adult')
    .eq('type', 'story')
    .in('status', ['approved', 'published'])
    .eq('genre', genre)
  if (error || !data) return []

  const rows = data as StoryRow[]
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

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const genre = genreBySlug(slug)
  if (!genre) notFound()

  const page = GENRE_PAGES[genre]
  const stories = await getStoriesByGenre(genre)

  // Сусідні жанри внизу сторінки: і читачеві є куди піти, і пошуковик
  // бачить звʼязок між розділами.
  const others = GENRES.filter((g) => g !== genre)

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: 'Історії', href: '/stories' }, { label: page.title }]} />

        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 8, color: 'var(--accent-gold)' }}>
          {page.title}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 0 24px', fontFamily: "'Montserrat', sans-serif", maxWidth: 640 }}>
          {page.description}
        </p>

        {stories.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Історій у цьому жанрі поки немає.</p>
        ) : (
          <StoriesPaged stories={stories} />
        )}

        <nav
          aria-label="Інші жанри"
          style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(239,159,39,0.2)' }}
        >
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px', fontFamily: "'Montserrat', sans-serif" }}>
            Інші жанри
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {others.map((g) => (
              <Link
                key={g}
                href={`/stories/zhanr/${GENRE_PAGES[g].slug}`}
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  padding: '9px 16px',
                  borderRadius: 22,
                  background: 'rgba(239,159,39,0.16)',
                  border: '1px solid rgba(239,159,39,0.5)',
                  color: '#fac775',
                  textDecoration: 'none',
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                {GENRE_PAGES[g].title}
              </Link>
            ))}
          </div>
        </nav>
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
