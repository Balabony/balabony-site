import type { Metadata } from 'next'

const GOLD      = '#f0a500'
const NAVY_DEEP = '#0a1628'
const FONT      = "'Montserrat', Arial, sans-serif"
const SERIF     = "'Lora', Georgia, serif"

export const metadata: Metadata = {
  title: 'Сторінку не знайдено · Балабони',
  description: 'Здається, ви відкрили посилання, якого більше немає. Поверніться на головну.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      background: NAVY_DEEP,
      color: '#f5f0e8',
      fontFamily: FONT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
      }}>

        {/* Велика декоративна "404" з фірмовим стилем */}
        <div style={{
          fontFamily: SERIF,
          fontSize: 'clamp(96px, 22vw, 156px)',
          fontWeight: 800,
          color: GOLD,
          lineHeight: 1,
          letterSpacing: '-0.05em',
          marginBottom: 8,
          textShadow: '0 4px 24px rgba(240,165,0,0.25)',
        }}>
          404
        </div>

        {/* Декоративний розділювач */}
        <div style={{
          width: 80,
          height: 2,
          background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`,
          margin: '0 auto 24px',
        }} />

        <h1 style={{
          fontFamily: SERIF,
          fontSize: 'clamp(24px, 5vw, 32px)',
          fontWeight: 700,
          color: '#f5f0e8',
          margin: '0 0 16px',
          lineHeight: 1.3,
        }}>
          Тут поки нічого немає
        </h1>

        <p style={{
          fontSize: 16,
          lineHeight: 1.7,
          color: '#8899bb',
          margin: '0 0 36px',
          maxWidth: 420,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Можливо, ви відкрили старе посилання, або сторінка ще в роботі.
          Спробуйте перейти на головну або в наші розділи.
        </p>

        {/* Кнопки навігації */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'center',
          marginBottom: 36,
        }}>
          <a href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: GOLD,
            color: '#0a1628',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
            fontFamily: FONT,
          }}>
            <HomeIcon />
            На головну
          </a>

          <a href="/stories" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'transparent',
            color: GOLD,
            border: `1.5px solid ${GOLD}66`,
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: FONT,
          }}>
            Історії →
          </a>
        </div>

        {/* Швидкі посилання */}
        <div style={{
          paddingTop: 24,
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{
            fontSize: 12,
            color: '#445566',
            margin: '0 0 12px',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontWeight: 600,
          }}>
            Або сюди
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            justifyContent: 'center',
          }}>
            {[
              { href: '/episodes', label: 'Серії' },
              { href: '/games', label: 'Ігри' },
              { href: '/about', label: 'Про автора' },
              { href: '/contact', label: 'Контакти' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontSize: 13,
                  color: '#8899bb',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(136,153,187,0.2)',
                  fontFamily: FONT,
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 6 L7 2 L12 6 L12 12 L8.5 12 L8.5 8.5 L5.5 8.5 L5.5 12 L2 12 Z"
        stroke="#0a1628"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
