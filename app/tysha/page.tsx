import type { Metadata } from 'next'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import TyshaSection from '../components/TyshaSection'
import TyshaAgeGate from '../components/TyshaAgeGate'

export const metadata: Metadata = {
  title: 'ТИША — авторський серіал Назара Колодія · Балабони',
  description: 'Усі серії авторського серіалу «ТИША». Проза для дорослих читачів (18+) українською мовою.',
  alternates: { canonical: '/tysha' },
  openGraph: {
    title: 'ТИША — авторський серіал',
    description: 'Усі серії авторського серіалу «ТИША». Українською мовою.',
    url: 'https://balabony.com/tysha',
    type: 'website',
  },
}

export default function TyshaIndexPage() {
  return (
    <ThemeProvider>
      <TyshaAgeGate />
      <Header />
      <main style={{ minHeight: '40vh', paddingTop: 8 }}>
        {/* Головна сторінка серіалу зі 103 серіями не мала h1 узагалі —
            ні тут, ні в TyshaSection. Для екранної читалки це означало
            сторінку без точки входу. */}
        <h1 style={{
          maxWidth: 1100, margin: '0 auto 8px', padding: '0 5%',
          fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 700,
          color: 'var(--accent-gold)', textAlign: 'center',
        }}>
          «Тиша» — авторський серіал Назара Колодія
        </h1>
        <TyshaSection coverOverride="/tysha-oblozhka-20260910-d.webp" />
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
