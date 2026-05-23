import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import SeriesStrip, { type SeriesCard } from '../components/SeriesStrip'

export const metadata: Metadata = {
  title: 'Усі серії Балабонів — українські історії для всієї родини',
  description: 'Каталог усіх серій Балабонів. Сімейні історії від Панаса, баби Гані та інших — для дітей, батьків і бабусь.',
  alternates: { canonical: '/episodes' },
  openGraph: {
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
}

async function getEpisodes(): Promise<SeriesCard[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, season_number, episode_number, cover_url, description')
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
  }))
}

export default async function EpisodesPage() {
  const series = await getEpisodes()

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 24, color: '#F5A623' }}>
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