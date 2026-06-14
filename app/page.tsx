'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from './components/Header'
import Hero from './components/Hero'
import FreeBanner from './components/FreeBanner'
import HowItWorks from './components/HowItWorks'
import ReaderSection from './components/ReaderSection'
import PricingSection from './components/PricingSection'
import FAQ from './components/FAQ'
import AudioPlayer from './components/AudioPlayer'
import DemoAudioPlayer from './components/DemoAudioPlayer'
import Footer from './components/Footer'
import FairytalesSection from './components/FairytalesSection'
import ResumeBanner from './components/ResumeBanner'
import { ThemeProvider } from './context/ThemeContext'
import SeriesStrip, { type SeriesCard } from './components/SeriesStrip'
import FreshStoriesGrid, { type Story } from './components/FreshStoriesGrid'
import InclusivitySection from './components/InclusivitySection'
import BonusSection from './components/BonusSection'
import AuthorSection from './components/AuthorSection'
import AboutBalabonySection from './components/AboutBalabonySection'
import PwaSection from './components/PwaSection'
import ChannelsSection from './components/ChannelsSection'
import SurveyPreviewSection from './components/SurveyPreviewSection'
import EmailCapture from './components/EmailCapture'

const FALLBACK_SERIES: SeriesCard[] = []

// Без хардкод-заглушок: блок «Свіжі історії» показуємо лише коли є реальні
// схвалені історії читачів з /api/stories. Інакше секція прихована.
const SAMPLE_STORIES: Story[] = []

const viewAllLinkStyle: React.CSSProperties = { display: 'inline-block', color: 'var(--accent-gold)', textDecoration: 'none', fontSize: 15, fontWeight: 600, fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }

const viewAllWrapperStyle: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '16px 20px', textAlign: 'center' }

export default function HomePage() {
  const [seriesData,   setSeriesData]   = useState<SeriesCard[]>(FALLBACK_SERIES)
  const [freshStories, setFreshStories] = useState<Story[]>(SAMPLE_STORIES)

  useEffect(() => {
    fetch('/api/series?limit=3&order=asc')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Array<{ id: string; number: number; season: number; title: string; cover_url: string | null; has_audio: boolean; url: string; description?: string; duration_minutes?: number | null }>) => {
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
            durationMinutes: s.duration_minutes ?? undefined,
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

  // Доскрол до якоря після того, як ліниві секції (ReaderSection та інші)
  // встигнуть домонтуватися і вплинути на висоту сторінки. Без цього
  // нативний скрол браузера зупиняється на старій позиції #pricing,
  // яка з'їжджає вниз після підвантаження контенту вище.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash || hash.length < 2) return

    const scrollToHash = () => {
      const el = document.getElementById(hash.slice(1))
      if (!el) return
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' })
    }

    // Дві спроби: коротка (на випадок швидкого рендеру) і довша (для лінивого контенту)
    const t1 = setTimeout(scrollToHash, 300)
    const t2 = setTimeout(scrollToHash, 900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <ThemeProvider>
      <Header />
      <ResumeBanner />
      <Hero />
        <FreeBanner />
        <div id="how-it-works" style={{ display: 'block', scrollMarginTop: '80px' }}>
          <HowItWorks />
        </div>
      <div id="series"><SeriesStrip series={seriesData} /></div>

      <div style={{ maxWidth: 760, margin: '20px auto 24px', padding: '0 20px' }}>
        <DemoAudioPlayer
          src="/audio/balabony_seria1_demo.mp3"
          badge="Демо"
          caption="Озвучення серії"
          title="«Панас і 5G на вишні»"
        />
      </div>
      <div style={viewAllWrapperStyle}>
        <Link href="/series" style={viewAllLinkStyle}>Усі серії →</Link>
      </div>
      <EmailCapture />
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
        </div>

        <div id="faq" style={{ display: 'block', scrollMarginTop: '80px' }}>
          <FAQ />
        </div>
        <div id="fairytales"><FairytalesSection /></div>

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
