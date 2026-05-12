'use client'

import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import FreshStoriesGrid, { type Story } from '../components/FreshStoriesGrid'

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stories?limit=200')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Story[]) => {
        if (Array.isArray(rows)) setStories(rows)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {loading && (
          <p style={{ color: '#94a3b8' }}>Завантаження…</p>
        )}
        {!loading && stories.length === 0 && (
          <p style={{ color: '#94a3b8' }}>Історій поки немає.</p>
        )}
      </main>
      {!loading && stories.length > 0 && <FreshStoriesGrid stories={stories} />}
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
