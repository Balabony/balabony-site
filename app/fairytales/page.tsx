import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import FreshStoriesGrid, { type Story } from '../components/FreshStoriesGrid'
import Breadcrumbs from '../components/Breadcrumbs'
import { toExcerpt } from '@/lib/plain-text'
import { pickPublishedText } from '@/lib/published-text'

export const metadata: Metadata = {
  title: 'Казки — Балабони',
  description: 'Українські казки на Балабонах: добрі, мудрі й сучасні історії для всієї родини. Українською мовою.',
  alternates: { canonical: '/fairytales' },
  openGraph: {
    title: 'Казки — Балабони',
    description: 'Українські казки на Балабонах: добрі, мудрі й сучасні історії для всієї родини.',
    url: 'https://balabony.com/fairytales',
    type: 'website',
  },
}

interface StoryRow {
  slug: string
  title: string
  author_name: string
  genre: string | null
  text: string
  corrected_text: string | null
  humanized_text: string | null
  published_version: string | null
  cover_url: string | null
  is_adult: boolean | null
}

async function getFairytales(): Promise<Story[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, author_name, genre, text, corrected_text, humanized_text, published_version, cover_url, approved_at, is_adult')
    .eq('type', 'story')
    .eq('genre', 'Казка')
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
    teaser: toExcerpt(pickPublishedText(s), 200),
    url: `/stories/${s.slug}`,
    genre: s.genre ?? undefined,
    isAdult: s.is_adult ?? false,
  }))
}

export default async function FairytalesPage() {
  const stories = await getFairytales()

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: 'Казки' }]} />
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 24, color: 'var(--accent-gold)' }}>
          Казки
        </h1>

        {stories.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Казок поки немає.</p>
        ) : (
          <FreshStoriesGrid stories={stories} />
        )}
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
