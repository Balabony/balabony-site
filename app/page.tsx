'use client'

import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import ReaderSection from './components/ReaderSection'
import PlatformsSection from './components/PlatformsSection'
import PricingSection from './components/PricingSection'
import AudioPlayer from './components/AudioPlayer'
import Footer from './components/Footer'
import NeuroMusicSection from './components/NeuroMusicSection'
import KaraokeSection from './components/KaraokeSection'
import LongevityClubSection from './components/LongevityClubSection'
import ResumeBanner from './components/ResumeBanner'
import { ThemeProvider } from './context/ThemeContext'
import SeriesStrip, { type SeriesCard } from './components/SeriesStrip'
import FreshStoriesGrid, { type Story } from './components/FreshStoriesGrid'

const FALLBACK_SERIES: SeriesCard[] = []

const BASE_COVER = 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers'

const SAMPLE_STORIES: Story[] = [
  { id: 's1', title: 'Рецепт від серця',  author: 'Оксана Мельник',  coverUrl: `${BASE_COVER}/s3-ep47-1777907593975.jpg`, tags: ['родина', 'кухня'],   hasAudio: true,  teaser: 'Найстаріший рецепт у родині завжди передавався з рук у руки — але що відбувається, коли передати вже нікому?', url: '/stories/1' },
  { id: 's2', title: 'Перший сніг',       author: 'Іван Коваленко',  coverUrl: `${BASE_COVER}/s3-ep46-1777908375713.jpg`, tags: ['зима', 'дитинство'], hasAudio: false, teaser: 'У пам\'яті дідуся перший сніг завжди пахне мандаринами і дровами у грубці.',                                 url: '/stories/2' },
  { id: 's3', title: 'Лист з минулого',   author: 'Марія Петренко',  coverUrl: `${BASE_COVER}/s3-ep45-1777908432264.jpg`, tags: ['пам\'ять', 'листи'], hasAudio: true,  teaser: 'Розбираючи горище, Галина знайшла стос листів, перев\'язаних синьою стрічкою. Адресат — вона сама.',         url: '/stories/3' },
]

function ShareIcon() {
  return (
    <svg
      width="14" height="16" viewBox="0 0 14 16" fill="none"
      stroke="#f5a623" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: 2 }}
    >
      <path d="M2 7 L2 14 Q2 15 3 15 L11 15 Q12 15 12 14 L12 7" />
      <line x1="7" y1="10" x2="7" y2="1" />
      <polyline points="3.5,5 7,1 10.5,5" />
    </svg>
  )
}

function AddToHomeIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      stroke="#f5a623" strokeWidth="1.6" strokeLinecap="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: 2 }}
    >
      <rect x="1" y="1" width="12" height="12" rx="2" />
      <line x1="7" y1="4" x2="7" y2="10" />
      <line x1="4" y1="7" x2="10" y2="7" />
    </svg>
  )
}

const ANDROID_STEPS = [
  'Відкрий balabony.com у Chrome',
  'Натисни ⋮ → «Додати на головний екран»',
  'Підтверди — іконка з\'явиться на робочому столі',
]

const IPHONE_STEPS: React.ReactNode[] = [
  'Відкрий balabony.com у браузері Safari',
  <>{'Натисни кнопку "Поділитися" '}<ShareIcon />{' — внизу екрану посередині'}</>,
  'У меню що відкрилось — прокрути список вниз',
  <>{'Натисни '}<AddToHomeIcon />{' "На Початковий екран"'}</>,
  'Натисни "Додати" у правому верхньому куті',
]

export default function HomePage() {
  const [seriesData,   setSeriesData]   = useState<SeriesCard[]>(FALLBACK_SERIES)
  const [freshStories, setFreshStories] = useState<Story[]>(SAMPLE_STORIES)

  useEffect(() => {
    fetch('/api/series')
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

    fetch('/api/stories')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Story[]) => {
        if (Array.isArray(rows) && rows.length > 0) setFreshStories(rows)
      })
      .catch(() => {})
  }, [])

  return (
    <ThemeProvider>
      <Header />
      <ResumeBanner />
      <Hero />
      <SeriesStrip series={seriesData} />
      <FreshStoriesGrid stories={freshStories} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0' }}>

        <ReaderSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />
        <PlatformsSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />
        <PricingSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />
        <KaraokeSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />
        <div id="neuro-music"><NeuroMusicSection /></div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />
        <div id="longevity-club"><LongevityClubSection /></div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />

        <div style={{
          background: '#0f1e3a', border: '1.5px solid #f5a623', borderRadius: 16,
          padding: 28, marginBottom: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1a2f4a', border: '1.5px solid rgba(245,166,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
                <rect x="8" y="24" width="40" height="24" rx="3" stroke="#f5a623" strokeWidth="2" fill="none"/>
                <rect x="8" y="15" width="40" height="11" rx="3" stroke="#f5a623" strokeWidth="2" fill="none"/>
                <line x1="28" y1="15" x2="28" y2="48" stroke="#f5a623" strokeWidth="2"/>
                <path d="M28 15 C28 15 20 13 19 9 C18 6 22 5 24 7 C26 9 28 15 28 15" stroke="#f5a623" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M28 15 C28 15 36 13 37 9 C38 6 34 5 32 7 C30 9 28 15 28 15" stroke="#f5a623" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: "'Montserrat', Arial, sans-serif" }}>Бонусна програма</div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
            {[
              'Запроси друга — ви обидва отримаєте по 50 бонусів',
              'Поділись історією — 10 бонусів за кожен шерінг',
              'Залиш відгук — 10 бонусів за кожен коментар',
              'Пройди опитування — 50 бонусів',
            ].map(line => (
              <li key={line} style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 10, lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#f5a623', fontWeight: 700, flexShrink: 0 }}>✓</span>{line}
              </li>
            ))}
          </ul>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
            <p style={{ fontSize: 14, color: '#8899bb', marginBottom: 16, textAlign: 'center' }}>
              Запроси друга — отримайте обидва по 50 бонусних балів на рахунок.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="text" readOnly defaultValue="balabony.com/ref?user123"
                onClick={e => (e.target as HTMLInputElement).select()}
                style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.15)', fontSize: 13, width: 220, background: 'rgba(255,255,255,0.06)', color: '#f5f0e8', fontFamily: "'Montserrat', sans-serif" }}
              />
              <button
                onClick={() => navigator.clipboard?.writeText('balabony.com/ref?user123')}
                style={{ padding: '8px 16px', background: 'var(--accent-gold)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}>
                Скопіювати
              </button>
            </div>
          </div>
        </div>

        <div style={{ background: '#1a2035', border: '1.5px solid #f5a623', borderRadius: 16, padding: 28, marginBottom: 56 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f5f0e8', marginBottom: 8, textAlign: 'center' }}>
            Завжди під рукою
          </h4>
          <p style={{ fontSize: 16, color: '#8899bb', textAlign: 'center', marginBottom: 24 }}>
            Додай Balabony на головний екран — як звичайний застосунок, без завантажень.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f5a623', marginBottom: 12, textAlign: 'center' }}>Android · Chrome</div>
              {ANDROID_STEPS.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <span style={{ minWidth: 28, height: 28, borderRadius: '50%', background: 'rgba(245,166,35,0.15)', border: '1.5px solid #f5a623', color: '#f5a623', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 17, color: '#c8d8e8', lineHeight: 1.6 }}>{step}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f5a623', marginBottom: 12, textAlign: 'center' }}>iPhone · Safari</div>
              {IPHONE_STEPS.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <span style={{ minWidth: 28, height: 28, borderRadius: '50%', background: 'rgba(245,166,35,0.15)', border: '1.5px solid #f5a623', color: '#f5a623', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 17, color: '#c8d8e8', lineHeight: 1.6 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />

        <div style={{
          background: '#0f1e3a', border: '1.5px solid #f5a623', borderRadius: 16,
          padding: 28, marginBottom: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1a2f4a', border: '1.5px solid rgba(245,166,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 56 56" fill="none">
                <path d="M36 10 L46 20 L20 46 L10 46 L10 36 Z" stroke="#f5a623" strokeWidth="2" fill="none" strokeLinejoin="round"/>
                <line x1="30" y1="16" x2="40" y2="26" stroke="#f5a623" strokeWidth="2" strokeLinecap="round"/>
                <line x1="10" y1="40" x2="10" y2="46" stroke="#f5a623" strokeWidth="1" strokeLinecap="round"/>
                <line x1="10" y1="46" x2="16" y2="46" stroke="#f5a623" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: "'Montserrat', Arial, sans-serif" }}>Стань автором Balabony</div>
          </div>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 16 }}>
            Пишеш історії? Публікуй їх на Balabony і отримуй гонорар з кожного прочитання. Ми ділимо доходи чесно:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
            <li style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 10, lineHeight: 1.6 }}>
              <span style={{ color: '#f5a623', fontWeight: 700 }}>50/50</span> — для авторів-ФОП
            </li>
            <li style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 10, lineHeight: 1.6 }}>
              <span style={{ color: '#f5a623', fontWeight: 700 }}>60/40</span> — для інших авторів (60% — платформі, 40% — автору; платформа сплачує податки за автора)
            </li>
          </ul>
          <a
            href="/become-author"
            style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--accent-gold)', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 16, textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}
          >
            Подати заявку →
          </a>
        </div>

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
