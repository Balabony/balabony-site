import type { Metadata } from 'next'
import { readingMinutes } from '@/lib/readingTime'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Каталог змінюється при публікації нових серій — не тримаємо вічний статичний кеш.
export const revalidate = 60
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import SeriesStrip, { type SeriesCard } from '../components/SeriesStrip'

export const metadata: Metadata = {
  title: 'Усі серії Балабонів — українські історії для всієї родини',
  description: 'Каталог усіх серій Балабонів. Сімейні історії від Панаса, баби Гані та інших — для дітей, батьків і бабусь.',
  alternates: { canonical: '/episodes' },
  openGraph: { images: ['https://balabony.com/og-image-v6.jpg'],
    title: 'Усі серії Балабонів',
    description: 'Каталог усіх серій Балабонів. Сімейні історії для дітей, батьків і бабусь.',
    url: 'https://balabony.com/episodes',
    type: 'website',
  },
}

interface EpisodeRow {
  slug: string
  title: string
  season_number: number
  episode_number: number
  cover_url: string | null
  description: string | null
  duration_minutes: number | null
  text: string | null
  corrected_text: string | null
  humanized_text: string | null
  published_version: string | null
}

async function getEpisodes(): Promise<SeriesCard[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, season_number, episode_number, cover_url, description, text, corrected_text, humanized_text, published_version')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })

  if (error || !data) return []

  return (data as EpisodeRow[]).map((e) => ({
    id: e.slug,
    number: e.episode_number,
    season: e.season_number,
    title: e.title,
    coverUrl: e.cover_url ?? '/og-image.jpg',
    hasAudio: false,
    url: `/episodes/${e.slug}`,
    description: e.description ?? undefined,
    durationMinutes: readingMinutes(e) || undefined,
  }))
}

export default async function EpisodesPage() {
  const series = await getEpisodes()

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* 01.11.2026: розмітка schema.org для Google і ШІ-пошуку */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Головна', item: 'https://balabony.com/' }, { '@type': 'ListItem', position: 2, name: 'Серіал «Балабони»', item: 'https://balabony.com/episodes' }] }, { '@context': 'https://schema.org', '@type': 'BookSeries', name: 'Балабони', url: 'https://balabony.com/episodes', inLanguage: 'uk', genre: 'Сімейний гумор', author: { '@type': 'Person', name: 'Назар Колодій' }, publisher: { '@type': 'Organization', name: 'Балабони', url: 'https://balabony.com' } }]) }} />
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 24, color: 'var(--accent-gold)' }}>
          Усі серії Балабонів
        </h1>
        {series.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Серій поки немає.</p>
        ) : (
          <SeriesStrip series={series} />
        )}
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}