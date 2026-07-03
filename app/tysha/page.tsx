import type { Metadata } from 'next'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import TyshaSection from '../components/TyshaSection'

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
      <Header />
      <main style={{ minHeight: '40vh', paddingTop: 8 }}>
        <TyshaSection />
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
