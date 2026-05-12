'use client'

import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import SeriesStrip, { type SeriesCard } from '../components/SeriesStrip'

export default function SeriesPage() {
  const [series, setSeries] = useState<SeriesCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/series?order=desc')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Array<{ id: string; number: number; season: number; title: string; cover_url: string | null; has_audio: boolean; url: string; description?: string }>) => {
        if (Array.isArray(rows)) {
          setSeries(rows.map(s => ({
            id:          s.id,
            number:      s.number,
            season:      s.season,
            title:       s.title,
            coverUrl:    s.cover_url ?? '/og-image.jpg',
            hasAudio:    s.has_audio,
            url:         s.url,
            description: s.description,
          })))
        }
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
        {!loading && series.length === 0 && (
          <p style={{ color: '#94a3b8' }}>Серій поки немає.</p>
        )}
      </main>
      {!loading && series.length > 0 && <SeriesStrip series={series} />}
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
