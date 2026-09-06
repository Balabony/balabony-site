'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from './components/Header'
import Hero from './components/Hero'
import FreeBanner from './components/FreeBanner'
import HowItWorks from './components/HowItWorks'
import PricingSection from './components/PricingSection'
import FAQ from './components/FAQ'
import AudioPlayer from './components/AudioPlayer'
import DemoAudioPlayer from './components/DemoAudioPlayer'
import Footer from './components/Footer'
import FairytalesSection from './components/FairytalesSection'
import { ThemeProvider } from './context/ThemeContext'
import SeriesStrip, { type SeriesCard } from './components/SeriesStrip'
import FreshStoriesGrid, { type Story } from './components/FreshStoriesGrid'
import TyshaSection from './components/TyshaSection'
import InclusivitySection from './components/InclusivitySection'
import BonusSection from './components/BonusSection'
import AuthorSection from './components/AuthorSection'
import AboutBalabonySection from './components/AboutBalabonySection'
import PwaSection from './components/PwaSection'
import ChannelsSection from './components/ChannelsSection'
import SurveyPreviewSection from './components/SurveyPreviewSection'
import EmailCapture from './components/EmailCapture'
import AuthorsStrip from './components/AuthorsStrip'

const FALLBACK_SERIES: SeriesCard[] = []

// Без хардкод-заглушок: блок «Свіжі історії» показуємо лише коли є реальні
// схвалені історії читачів з /api/stories. Інакше секція прихована.
const SAMPLE_STORIES: Story[] = []

const viewAllLinkStyle: React.CSSProperties = { display: 'inline-block', color: 'var(--accent-gold)', textDecoration: 'none', fontSize: 15, fontWeight: 600, fontFamily: "'Montserrat', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }

const doorsWrapStyle: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '4px 20px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }

const doorStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 0, padding: '16px 4px', textAlign: 'center', borderRadius: 12, textDecoration: 'none', background: 'rgba(239,159,39,0.04)', border: '1px solid rgba(239,159,39,0.32)', fontFamily: "'Montserrat', sans-serif" }

// Заголовок підлаштовується під ширину екрана: на вузьких телефонах
// «ДОРОСЛИМ» при 16px виходило за межі картки.
const doorTitleStyle: React.CSSProperties = { fontSize: 'clamp(12px, 3.4vw, 16px)', fontWeight: 700, color: 'var(--accent-gold-light, #FAC775)', letterSpacing: '0.02em', lineHeight: 1.2, whiteSpace: 'nowrap' }

const doorSubStyle: React.CSSProperties = { fontSize: 'clamp(10px, 2.8vw, 12px)', color: '#C08A2E', lineHeight: 1.25 }

const badge18Style: React.CSSProperties = { background: '#e0484d', color: '#FFF8EE', fontSize: 10, padding: '1px 5px', borderRadius: 3, verticalAlign: 2 }

const viewAllWrapperStyle: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '16px 20px', textAlign: 'center' }

export default function HomePage() {
  const [seriesData,   setSeriesData]   = useState<SeriesCard[]>(FALLBACK_SERIES)
  const [freshStories, setFreshStories] = useState<Story[]>(SAMPLE_STORIES)

  useEffect(() => {
    fetch('/api/series?limit=3&order=asc')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Array<{ id: string; number: number; season: number; title: string; cover_url: string | null; has_audio: boolean; url: string; description?: string; teaser?: string | null; duration_minutes?: number | null }>) => {
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
            teaser:      s.teaser ?? undefined,
            durationMinutes: s.duration_minutes ?? undefined,
          })))
        }
      })
      .catch(() => {})

    fetch('/api/stories?rotate=1&limit=3&exclude_genre=' + encodeURIComponent('Казка'))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Story[]) => {
        if (Array.isArray(rows) && rows.length > 0) setFreshStories(rows.slice(0, 4))
      })
      .catch(() => {})
  }, [])

  // Доскрол до якоря після того, як ліниві секції
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
      <Hero />
        <FreeBanner />

      {/* Три двері — якорі до розділів */}
      <nav aria-label="Розділи" style={doorsWrapStyle}>
        <a href="#series" style={doorStyle}>
          <span style={doorTitleStyle}>ДІТЯМ</span>
          <span style={doorSubStyle}>казки й Балабони</span>
        </a>
        <a href="#stories-fresh" style={doorStyle}>
          <span style={doorTitleStyle}>ДОРОСЛИМ</span>
          <span style={doorSubStyle}>історії авторів</span>
        </a>
        <a href="#tysha" style={doorStyle}>
          <span style={doorTitleStyle}>ТИША <span style={badge18Style}>18+</span></span>
          <span style={doorSubStyle}>воєнна драма</span>
        </a>
      </nav>

      <div id="series"><SeriesStrip series={seriesData} /></div>

      <div style={viewAllWrapperStyle}>
        <Link href="/episodes" style={viewAllLinkStyle}>Усі серії →</Link>
      </div>

      {freshStories.length > 0 && (
        <div id="stories-fresh">
          <FreshStoriesGrid stories={freshStories} />
          <div style={viewAllWrapperStyle}>
            <Link href="/stories" style={viewAllLinkStyle}>Усі історії →</Link>
          </div>
        </div>
      )}

      <div id="fairytales"><FairytalesSection /></div>

      <div id="tysha"><TyshaSection limit={3} showAllLink /></div>

      <EmailCapture />

      <div style={{ display: 'block' }}>
        <HowItWorks />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0' }}>
        <AboutBalabonySection />
        <InclusivitySection />
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0' }}>

        <div style={{ display: 'block' }}>
          <PricingSection />
        </div>

        <div style={{ display: 'block' }}>
          <FAQ limit={5} showAllLink />
        </div>

        <BonusSection />

        <PwaSection />      <ChannelsSection />

        <AuthorsStrip limit={8} />

        <AuthorSection />
        <SurveyPreviewSection />
      </main>

      <div style={{ background: '#FFF8EE', padding: '20px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px' }}>
          <DemoAudioPlayer
            src="/audio/balabony_seria1_demo.mp3"
            badge="Демо"
            caption="Озвучення серії"
            title="«Панас і 5G на вишні»"
          />
        </div>
      </div>

      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
