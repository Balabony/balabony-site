'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from './components/Header'
import Hero from './components/Hero'
import ReaderSection from './components/ReaderSection'
import PlatformsSection from './components/PlatformsSection'
import PricingSection from './components/PricingSection'
import AudioPlayer from './components/AudioPlayer'
import Footer from './components/Footer'
import LongevityClubSection from './components/LongevityClubSection'
import FairytalesSection from './components/FairytalesSection'
import ResumeBanner from './components/ResumeBanner'
import { ThemeProvider } from './context/ThemeContext'
import SeriesStrip, { type SeriesCard } from './components/SeriesStrip'
import FreshStoriesGrid, { type Story } from './components/FreshStoriesGrid'
import InclusivitySection from './components/InclusivitySection'
import BonusSection from './components/BonusSection'
import AuthorSection from './components/AuthorSection'
import PwaSection from './components/PwaSection'
import ChannelsSection from './components/ChannelsSection'

const FALLBACK_SERIES: SeriesCard[] = []

const BASE_COVER = 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers'

const SAMPLE_STORIES: Story[] = [
  { id: 's1', title: 'Рецепт від серця',  author: 'Оксана Мельник',  coverUrl: `${BASE_COVER}/s3-ep47-1777907593975.jpg`, tags: ['родина', 'кухня'],   hasAudio: true,  teaser: 'Найстаріший рецепт у родині завжди передавався з рук у руки — але що відбувається, коли передати вже нікому?', url: '/stories/1' },
  { id: 's2', title: 'Перший сніг',       author: 'Іван Коваленко',  coverUrl: `${BASE_COVER}/s3-ep46-1777908375713.jpg`, tags: ['зима', 'дитинство'], hasAudio: false, teaser: 'У пам\'яті дідуся перший сніг завжди пахне мандаринами і дровами у грубці.',                                 url: '/stories/2' },
  { id: 's3', title: 'Лист з минулого',   author: 'Марія Петренко',  coverUrl: `${BASE_COVER}/s3-ep45-1777908432264.jpg`, tags: ['пам\'ять', 'листи'], hasAudio: true,  teaser: 'Розбираючи горище, Галина знайшла стос листів, перев\'язаних синьою стрічкою. Адресат — вона сама.',         url: '/stories/3' },
]

const viewAllLinkStyle: React.CSSProperties = { display: 'inline-block', color: '#f5a623', textDecoration: 'none', fontSize: 15, fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }

const viewAllWrapperStyle: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '4px 20px 24px', textAlign: 'center' }

export default function HomePage() {
  const [seriesData,   setSeriesData]   = useState<SeriesCard[]>(FALLBACK_SERIES)
  const [freshStories, setFreshStories] = useState<Story[]>(SAMPLE_STORIES)

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
      <SeriesStrip series={seriesData} />
      <div style={viewAllWrapperStyle}>
        <Link href="/series" style={viewAllLinkStyle}>Усі серії →</Link>
      </div>
      <FreshStoriesGrid stories={freshStories} />
      <div style={viewAllWrapperStyle}>
        <Link href="/stories" style={viewAllLinkStyle}>Усі історії →</Link>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0' }}>

        <ReaderSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />
        <PlatformsSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />
        <PricingSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />
        <div id="longevity-club"><LongevityClubSection /></div>
        <div id="fairytales"><FairytalesSection /></div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ІНКЛЮЗИВНІСТЬ                                                  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <InclusivitySection />
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />

        <BonusSection />

        <PwaSection />      <ChannelsSection />

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />

        <AuthorSection />

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />

        <div style={{
          background: '#0f1e3a', border: '1.5px solid #f5a623', borderRadius: 16,
          padding: 28, marginBottom: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1a2f4a', border: '1.5px solid rgba(245,166,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
                <rect x="12" y="10" width="32" height="38" rx="4" stroke="#f5a623" strokeWidth="2" fill="none"/>
                <rect x="20" y="6" width="16" height="9" rx="3" stroke="#f5a623" strokeWidth="1.5" fill="none"/>
                <line x1="20" y1="26" x2="36" y2="26" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="20" y1="33" x2="36" y2="33" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="20" y1="40" x2="30" y2="40" stroke="#f5a623" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: "'Montserrat', Arial, sans-serif" }}>Пройди опитування — отримай 50 бонусів</div>
          </div>
          <p style={{ fontSize: 15, color: '#8899bb', marginBottom: 14 }}>
            Допоможи нам стати кращими — це займе 3 хвилини
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 24 }}>
            Ми хочемо краще розуміти тебе як читача. Пройди коротке анонімне опитування і отримай 50 бонусних балів на рахунок одразу після завершення.
          </p>
          <a
            href="/survey"
            target="_blank"
            style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--accent-gold)', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 16, textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}
          >
            Пройти опитування →
          </a>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />

      </main>

      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}



