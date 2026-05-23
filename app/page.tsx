'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from './components/Header'
import Hero from './components/Hero'
import ReaderSection from './components/ReaderSection'
import PricingSection from './components/PricingSection'
import AudioPlayer from './components/AudioPlayer'
import Footer from './components/Footer'
import LongevityClubSection from './components/LongevityClubSection'
import FairytalesSection from './components/FairytalesSection'
import ResumeBanner from './components/ResumeBanner'
import { ThemeProvider } from './context/ThemeContext'
import SeriesStrip, { type SeriesCard } from './components/SeriesStrip'
import BalabonyHomeBlock from './components/BalabonyHomeBlock'
import FreshStoriesGrid, { type Story } from './components/FreshStoriesGrid'
import InclusivitySection from './components/InclusivitySection'
import BonusSection from './components/BonusSection'
import AuthorSection from './components/AuthorSection'
import AboutBalabonySection from './components/AboutBalabonySection'
import PwaSection from './components/PwaSection'
import ChannelsSection from './components/ChannelsSection'
import SurveyPreviewSection from './components/SurveyPreviewSection'

const FALLBACK_SERIES: SeriesCard[] = []

const viewAllLinkStyle: React.CSSProperties = { display: 'inline-block', color: '#f5a623', textDecoration: 'none', fontSize: 15, fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }

const viewAllWrapperStyle: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '4px 20px 24px', textAlign: 'center' }

export default function HomePage() {
  const [seriesData,   setSeriesData]   = useState<SeriesCard[]>(FALLBACK_SERIES)
  const [freshStories, setFreshStories] = useState<Story[]>([])

  useEffect(() => {
    fetch('/api/series?limit=3&order=asc')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Array<{ id: string; number: number; season: number; title: string; cover_url: string | null; has_audio: boolean; url: string; description?: string }>) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setSeriesData(rows.map(s => ({
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

    fetch('/api/stories?exclude_genre=' + encodeURIComponent('Казка'))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Story[]) => {
        if (Array.isArray(rows) && rows.length > 0) setFreshStories(rows.slice(0, 3))
      })
      .catch(() => {})
  }, [])

  return (
    <ThemeProvider>
      <Header />
      <ResumeBanner />
      <Hero />
      <div id="series"><BalabonyHomeBlock /></div>
      {freshStories.length > 0 && (
        <>
          <FreshStoriesGrid stories={freshStories} />
          <div style={viewAllWrapperStyle}>
            <Link href="/stories" style={viewAllLinkStyle}>Усі історії →</Link>
          </div>
        </>
      )}

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0' }}>

        <div id="reader" style={{ display: 'block', scrollMarginTop: '80px' }}>
          <ReaderSection />
        </div>

        <div id="pricing" style={{ display: 'block', scrollMarginTop: '80px' }}>
          <PricingSection />
        </div>        <div id="fairytales"><FairytalesSection /></div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ІНКЛЮЗИВНІСТЬ                                                  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <InclusivitySection />
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <BonusSection />

        <PwaSection />      <ChannelsSection />
        <AboutBalabonySection />
        <AuthorSection />
        <SurveyPreviewSection />
      </main>

      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}

