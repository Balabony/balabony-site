import type { Metadata } from 'next'
import Link from 'next/link'
import DemoAudioPlayer from '../components/DemoAudioPlayer'

const NAVY_DEEP = '#0a1628'
const GOLD      = '#f0a500'
const FONT      = "'Montserrat', Arial, sans-serif"

export const metadata: Metadata = {
  title: 'Тестовий голос — Balabony',
  description: 'Послухайте демо озвучення серії «Панас і 5G на вишні» на платформі Balabony.',
}

export default function DemoPage() {
  return (
    <main style={{ minHeight: '70vh', background: NAVY_DEEP, padding: '56px 20px 80px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 14 }}>
          Balabony · Демо
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#f5f0e8', lineHeight: 1.2, margin: '0 0 10px', fontFamily: FONT }}>
          Тестовий голос Balabony
        </h1>
        <p style={{ fontSize: 16, color: '#8fa3c4', lineHeight: 1.7, margin: '0 auto 28px', maxWidth: 560, fontFamily: FONT }}>
          Демо озвучення серії. Повноцінне багатоголосе озвучення — у розробці.
        </p>

        <div style={{ background: '#FFF8EE', padding: '20px', borderRadius: 18, textAlign: 'left' }}>
          <DemoAudioPlayer
            src="/audio/balabony_seria1_demo.mp3"
            badge="Демо"
            caption="Озвучення серії"
            title="«Панас і 5G на вишні»"
          />
        </div>

        <Link
          href="/"
          style={{ display: 'inline-block', marginTop: 28, fontSize: 14, fontWeight: 800, color: NAVY_DEEP, background: GOLD, borderRadius: 12, padding: '13px 26px', textDecoration: 'none', fontFamily: FONT }}
        >
          На платформу balabony.com →
        </Link>
      </div>
    </main>
  )
}
