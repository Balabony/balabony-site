'use client'

import Header from './components/Header'
import Hero from './components/Hero'
import ReaderSection from './components/ReaderSection'
import PlatformsSection from './components/PlatformsSection'
import PricingSection from './components/PricingSection'
import AudioPlayer from './components/AudioPlayer'
import Footer from './components/Footer'
import KaraokeSection from './components/KaraokeSection'
import NeuroMusicSection from './components/NeuroMusicSection'
import LongevityClubSection from './components/LongevityClubSection'
import ResumeBanner from './components/ResumeBanner'

export default function HomePage() {
  return (
    <>
      <Header />
      <ResumeBanner />
      <Hero />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 20px 60px' }}>

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
            Ми будуємо екосистему цифрового добробуту для літніх людей. Наша мета — не лише розважати, 
            а й активно підтримувати ментальне та когнітивне здоров'я нації. Через музичну терапію, 
            ігрові механіки для стимуляції мозку та безпечний зв'язок ми запобігаємо стресам, деменції 
            та когнітивному занепаду, повертаючи літнім людям радість активного життя.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
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
            <a href="#reader" style={{ background: '#0D1B3E', border: '1px solid #D4A017', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                <circle cx="12" cy="6" r="3.5" stroke="#ef9f27" strokeWidth="1.5" fill="none"/>
                <circle cx="5" cy="17" r="2.5" stroke="#ef9f27" strokeWidth="1.5" fill="none"/>
                <circle cx="19" cy="17" r="2.5" stroke="#ef9f27" strokeWidth="1.5" fill="none"/>
                <path d="M10 9 Q8 11 7 14" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <path d="M14 9 Q16 11 17 14" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <path d="M10 12 L12 10 L14 12 L13 14 L12 15 L11 14 Z" fill="#ef9f27" opacity="0.7"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Родинний зв'язок</span>
            </a>
            {/* Цифрова безпека */}
            <a href="#pricing" style={{ background: '#0D1B3E', border: '1px solid #D4A017', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                <path d="M12 2 Q18 5 19 12 Q19 18 12 22 Q5 18 5 12 Q5 5 12 2Z" stroke="#ef9f27" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                <path d="M9 12 L11 14 L15 10" stroke="#ef9f27" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Цифрова безпека</span>
            </a>
          </div>
        </div>

        <ReaderSection />
        <PlatformsSection />
        <PricingSection />

        {/* Нові модулі */}
        <KaraokeSection />
        <div id="neuro-music"><NeuroMusicSection /></div>
        <div id="longevity-club"><LongevityClubSection /></div>

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

        <section id="docs" style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px 24px', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600, color: 'var(--text)', textAlign: 'center', marginBottom: 40 }}>
            Юридична інформація
          </h2>
          {[
            {
              title: 'Угода користувача',
              content: 'Ця Угода регулює доступ та використання платформи Balabony. Контент платформи захищений авторським правом. Будь-яке копіювання чи розповсюдження аудіофайлів без дозволу заборонено. Адміністрація не несе відповідальності за тимчасові технічні збої месенджерів (Telegram, Viber). Користувач зобов\'язується надавати правдиві дані для валідації через сервіс «Дія» при обранні соціального тарифу.',
            },
            {
              title: 'Політика конфіденційності',
              content: 'Ми поважаємо ваші дані згідно із Законом України «Про захист персональних даних». Ми збираємо лише ті дані, які необхідні для функціонування бота та ідентифікації оплати. Дані про валідацію через «Дія» обробляються згідно з державними стандартами безпеки. Ми не передаємо ваші контактні дані третім особам для маркетингових цілей.',
            },
            {
              title: 'Публічна оферта',
              content: 'Акцептом оферти вважається здійснення оплати обраного тарифу. Послуга вважається наданою в момент відкриття доступу до аудіофайлів у месенджері. Повернення коштів за цифрові товари належної якості після надання доступу не здійснюється згідно з законодавством України. Ціни на тарифи можуть бути змінені адміністрацією з попередженням на сайті.',
            },
          ].map(item => (
            <div key={item.title} style={{ marginBottom: 40 }}>
              <h3 style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid var(--accent-gold)', display: 'inline-block' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, textAlign: 'justify' }}>{item.content}</p>
            </div>
          ))}
        </section>

      </main>

      <Footer />
      <AudioPlayer />
    </>
  )
}
