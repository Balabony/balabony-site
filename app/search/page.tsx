import type { Metadata } from 'next'
import { Suspense } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import SearchClient from '../components/SearchClient'

export const metadata: Metadata = {
  title: 'Пошук — Балабони',
  description: 'Пошук творів і авторів на Балабонах: за назвою історії, іменем або псевдонімом автора.',
  alternates: { canonical: '/search' },
  // Сторінка результатів існує в нескінченній кількості варіантів —
  // у видачі має бути каталог, а не вона.
  robots: { index: false, follow: true },
}

export default function SearchPage() {
  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{
          fontFamily: '"Comfortaa", sans-serif',
          fontSize: 32,
          margin: '0 0 24px',
          color: 'var(--accent-gold)',
        }}>
          Пошук
        </h1>

        <Suspense fallback={null}>
          <SearchClient />
        </Suspense>
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
