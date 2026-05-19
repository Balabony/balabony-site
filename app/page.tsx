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
import FreshStoriesGrid, { type Story } from './components/FreshStoriesGrid'
import InclusivitySection from './components/InclusivitySection'
import BonusSection from './components/BonusSection'
import AuthorSection from './components/AuthorSection'
import AboutAuthorSection from './components/AboutAuthorSection'
import PwaSection from './components/PwaSection'
import ChannelsSection from './components/ChannelsSection'
import SurveyPreviewSection from './components/SurveyPreviewSection'

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

        <PricingSection />
        <div id="longevity-club"><LongevityClubSection /></div>
        <div id="fairytales"><FairytalesSection /></div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ІНКЛЮЗИВНІСТЬ                                                  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <InclusivitySection />
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <BonusSection />

        <PwaSection />      <ChannelsSection />
        <AboutAuthorSection />
        <AuthorSection />
        <SurveyPreviewSection />
      </main>

      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
