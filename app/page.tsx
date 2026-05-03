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
      <LatestEpisodeHero episode={LATEST_EPISODE} />
      <SeriesStrip series={SAMPLE_SERIES} />
      <FreshStoriesGrid stories={SAMPLE_STORIES} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 0' }}>

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
