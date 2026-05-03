'use client'

import Header from './components/Header'
import Hero from './components/Hero'
import ReaderSection from './components/ReaderSection'
import PlatformsSection from './components/PlatformsSection'
import PricingSection from './components/PricingSection'
import AudioPlayer from './components/AudioPlayer'
import Footer from './components/Footer'
import NeuroMusicSection from './components/NeuroMusicSection'
import ResumeBanner from './components/ResumeBanner'
import { ThemeProvider } from './context/ThemeContext'
import StatsSection from './components/StatsSection'
import LatestEpisodeHero from './components/LatestEpisodeHero'
import SeriesStrip, { type SeriesCard } from './components/SeriesStrip'
import FreshStoriesGrid, { type Story } from './components/FreshStoriesGrid'
import type { Episode } from './components/LatestEpisodeHero'

const LATEST_EPISODE: Episode = {
  number: 47, season: 3,
  title: 'Балабони та загублений рецепт',
  coverUrl: '/covers/ep47.jpg',
  teaser: 'Бабуся Параска сорок років зберігала рецепт борщу в старому записнику, але одного ранку він зник. Вся родина Балабонів кидається на пошуки — і знаходить набагато більше, ніж очікувала.',
  hasAudio: true,
  readUrl: '/episodes/47',
  audioUrl: '/audio/47',
}

const SAMPLE_SERIES: SeriesCard[] = [
  { id: '47', number: 47, season: 3, title: 'Загублений рецепт',       coverUrl: '/covers/ep47.jpg',  hasAudio: true,  url: '/episodes/47' },
  { id: '46', number: 46, season: 3, title: 'Велика прогулянка',        coverUrl: '/covers/ep46.jpg',  hasAudio: true,  url: '/episodes/46' },
  { id: '45', number: 45, season: 3, title: 'Дощ у суботу',             coverUrl: '/covers/ep45.jpg',  hasAudio: false, url: '/episodes/45' },
  { id: '44', number: 44, season: 3, title: 'Сусід з третього поверху', coverUrl: '/covers/ep44.jpg',  hasAudio: true,  url: '/episodes/44' },
  { id: '43', number: 43, season: 2, title: 'Літо у Карпатах',          coverUrl: '/covers/ep43.jpg',  hasAudio: false, url: '/episodes/43' },
  { id: '42', number: 42, season: 2, title: 'Повернення Михайла',       coverUrl: '/covers/ep42.jpg',  hasAudio: true,  url: '/episodes/42' },
]

const SAMPLE_STORIES: Story[] = [
  { id: 's1', title: 'Рецепт від серця',      author: 'Оксана Мельник',   coverUrl: '/stories/s1.jpg', tags: ['родина', 'кухня'],    hasAudio: true,  teaser: 'Найстаріший рецепт у родині завжди передавався з рук у руки — але що відбувається, коли передати вже нікому?',  url: '/stories/1' },
  { id: 's2', title: 'Перший сніг',           author: 'Іван Коваленко',   coverUrl: '/stories/s2.jpg', tags: ['зима', 'дитинство'],  hasAudio: false, teaser: 'У пам\'яті дідуся перший сніг завжди пахне мандаринами і дровами у грубці.',                                  url: '/stories/2' },
  { id: 's3', title: 'Лист з минулого',       author: 'Марія Петренко',   coverUrl: '/stories/s3.jpg', tags: ['пам\'ять', 'листи'], hasAudio: true,  teaser: 'Розбираючи горище, Галина знайшла стос листів, перев\'язаних синьою стрічкою. Адресат — вона сама.',          url: '/stories/3' },
  { id: 's4', title: 'Яблуня у дворі',        author: 'Степан Гнатенко',  coverUrl: '/stories/s4.jpg', tags: ['природа', 'сад'],     hasAudio: false, teaser: 'Яблуня, що посадив дід ще у п\'ятдесятих, досі плодоносить. Онук вирішив її зрубати — і не зміг.',            url: '/stories/4' },
  { id: 's5', title: 'Танці у вівторок',      author: 'Ніна Сидоренко',   coverUrl: '/stories/s5.jpg', tags: ['клуб', 'музика'],     hasAudio: true,  teaser: 'У будинку культури щовівторка грає жива музика. Баба Тамара прийшла вперше — і стала постійною відвідувачкою.', url: '/stories/5' },
  { id: 's6', title: 'Телефонна розмова',     author: 'Олег Бондаренко',  coverUrl: '/stories/s6.jpg', tags: ['зв\'язок', 'сім\'я'], hasAudio: true,  teaser: 'Щоп\'ятниці о восьмій ранку — телефонний дзвінок від сина. Навіть коли він забуває, мама чекає.',              url: '/stories/6' },
]

export default function HomePage() {
  return (
    <ThemeProvider>
      <Header />
      <ResumeBanner />
      <Hero />
      <StatsSection />
      <LatestEpisodeHero episode={LATEST_EPISODE} />
      <SeriesStrip series={SAMPLE_SERIES} />
      <FreshStoriesGrid stories={SAMPLE_STORIES} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 0' }}>

        {/* Місія */}
        <div style={{
          background: 'var(--bg-deep)', color: '#fff', padding: 36,
          borderRadius: 20, marginBottom: 56
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>🇺🇦</span>
            <h3 style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 600 }}>
              Балабони: Родина
            </h3>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.9, marginBottom: 20 }}>
            Українські історії для всієї родини.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {/* Історії */}
            <a href="#reader" style={{ background: '#0D1B3E', border: '1px solid #D4A017', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                <path d="M12 7 Q9 5 4 6 L4 20 Q9 19 12 21Z" stroke="#ef9f27" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                <path d="M12 7 Q15 5 20 6 L20 20 Q15 19 12 21Z" stroke="#ef9f27" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                <line x1="12" y1="7" x2="12" y2="21" stroke="#ef9f27" strokeWidth="1.2"/>
                <line x1="6" y1="10" x2="10" y2="9.5" stroke="#ef9f27" strokeWidth="1" strokeLinecap="round"/>
                <line x1="6" y1="13" x2="10" y2="12.5" stroke="#ef9f27" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Історії</span>
            </a>
            {/* Музична терапія */}
            <a href="#neuro-music" style={{ background: '#0D1B3E', border: '1px solid #D4A017', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                <path d="M5 12 Q8 6 11 12 Q14 18 17 12" stroke="#ef9f27" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <circle cx="9" cy="19" r="3" stroke="#ef9f27" strokeWidth="1.5" fill="none"/>
                <line x1="12" y1="19" x2="12" y2="8" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="12" y1="8" x2="19" y2="6" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Музична терапія</span>
            </a>
            {/* Когнітивний тренінг */}
            <a href="#longevity-club" style={{ background: '#0D1B3E', border: '1px solid #D4A017', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                <path d="M12 21 Q8 21 7 17 Q5 16 5 13 Q4 11 6 9 Q6 6 9 5 Q10 3 12 3 Q14 3 15 5 Q18 6 18 9 Q20 11 19 13 Q19 16 17 17 Q16 21 12 21Z" stroke="#ef9f27" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                <path d="M9 10 Q12 8 15 10" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <path d="M9 13 Q12 11 15 13" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <path d="M14 4 L15 1 L16 4" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Когнітивний тренінг</span>
            </a>
            {/* Родинний зв'язок */}
            <a href="#pricing" style={{ background: '#0D1B3E', border: '1px solid #D4A017', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                <circle cx="12" cy="6" r="3.5" stroke="#ef9f27" strokeWidth="1.5" fill="none"/>
                <circle cx="5" cy="17" r="2.5" stroke="#ef9f27" strokeWidth="1.5" fill="none"/>
                <circle cx="19" cy="17" r="2.5" stroke="#ef9f27" strokeWidth="1.5" fill="none"/>
                <path d="M10 9 Q8 11 7 14" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <path d="M14 9 Q16 11 17 14" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <path d="M10 12 L12 10 L14 12 L13 14 L12 15 L11 14 Z" fill="#ef9f27" opacity="0.7"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Родинний зв&apos;язок</span>
            </a>
          </div>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '40px 0' }} />
        <ReaderSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '40px 0' }} />
        <PlatformsSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '40px 0' }} />
        <PricingSection />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '40px 0' }} />
        <div id="neuro-music"><NeuroMusicSection /></div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '40px 0' }} />

        <div style={{
          background: '#0f1e3a', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 16,
          padding: 28, marginBottom: 56, textAlign: 'center'
        }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f5f0e8', marginBottom: 8 }}>
            Реферальна програма
          </h4>
          <p style={{ fontSize: 14, color: '#8899bb', marginBottom: 16 }}>
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
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '40px 0' }} />

      </main>

      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
