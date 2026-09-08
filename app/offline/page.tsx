import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * Сторінка, яку показує service worker, коли мережі немає, а потрібної
 * сторінки в кеші теж немає. Раніше замість неї підсовувалася головна —
 * читач бачив сайт і не розумів, чому нічого не відкривається.
 *
 * Свідомо без зайвого: жодних запитів, жодних зображень — усе, що тут є,
 * має працювати без мережі.
 */

export const metadata: Metadata = {
  title: 'Немає з’єднання — Балабони',
  description: 'Сторінка недоступна без інтернету.',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        background: 'linear-gradient(180deg, #0a1628 0%, #0f1f3a 100%)',
        fontFamily: "'Montserrat', sans-serif",
        color: '#FFF8EE',
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef9f27 0%, #f4b942 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Comfortaa', sans-serif",
            fontWeight: 700,
            fontSize: '1.6rem',
            color: '#0a1628',
          }}
        >
          Б
        </div>

        <h1
          style={{
            fontFamily: "'Comfortaa', sans-serif",
            fontSize: 'clamp(20px, 5vw, 26px)',
            fontWeight: 700,
            margin: '0 0 12px',
          }}
        >
          Немає з’єднання
        </h1>

        <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.9, margin: '0 0 8px' }}>
          Ця сторінка ще не збережена на вашому пристрої, а інтернету зараз немає.
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.6, opacity: 0.9, margin: '0 0 24px' }}>
          Тексти, які ви вже читали, лишаються доступними — спробуйте відкрити їх
          зі списку серій.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #ef9f27 0%, #f4b942 100%)',
              color: '#0a1628',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: 15,
            }}
          >
            На головну
          </Link>

          <Link
            href="/episodes"
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid rgba(239,159,39,0.5)',
              color: '#FAC775',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 15,
            }}
          >
            Серії
          </Link>
        </div>
      </div>
    </main>
  )
}
