import type { Metadata } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import FreshStoriesGrid, { type Story } from '../components/FreshStoriesGrid'

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

export default async function StoriesPage() {
  const stories = await getStories()

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 24, color: '#F5A623' }}>
          Історії читачів
        </h1>
        {stories.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Історій поки немає.</p>
        ) : (
          <FreshStoriesGrid stories={stories} />
        )}
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}