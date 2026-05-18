export default function Hero() {
  const navItems = [
    { label: 'ІСТОРІЇ', href: '/stories' },
    { label: 'СЕРІЇ', href: '/series' },
    { label: 'ІГРИ', href: '#games' },
    { label: 'КАЗКИ', href: '/stories?genre=fairytale' },
  ]

  return (
    <>
      <div
        style={{
          background:
            'linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%)',
          padding: '64px 5% 72px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Дві золотих радіальних "плями" — фірмовий патерн section-dark */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(239,159,39,0.18), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(239,159,39,0.14), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          {/* Внутрішня навігація Hero */}
          <nav
            aria-label="Розділи Балабонів"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 18,
              flexWrap: 'wrap',
              marginBottom: 28,
            }}
          >
            {navItems.map((item, i) => (
              <span
                key={item.label}
                style={{ display: 'flex', alignItems: 'center', gap: 18 }}
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      color: 'rgba(239,159,39,0.4)',
                      fontSize: 14,
                    }}
                  >
                    ·
                  </span>
                )}
                <a
                  href={item.href}
                  style={{
                    color: '#EF9F27',
                    fontWeight: 500,
                    fontSize: 13,
                    textDecoration: 'none',
                    fontFamily: "'Montserrat', sans-serif",
                    letterSpacing: 1.8,
                  }}
                >
                  {item.label}
                </a>
              </span>
            ))}
          </nav>

          {/* Заголовок + підрядок + CTA */}
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontFamily: "'Lora', serif",
                fontSize: 'clamp(32px, 7vw, 56px)',
                fontWeight: 500,
                color: '#FFFFFF',
                lineHeight: 1.15,
                letterSpacing: -0.5,
                margin: '0 0 14px',
              }}
            >
              Читай українське
            </h1>

            <p
              style={{
                fontSize: 'clamp(15px, 2.2vw, 18px)',
                color: '#B5D4F4',
                margin: '0 0 26px',
                lineHeight: 1.5,
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Історії для всієї родини
            </p>

            <a
              href="/series"
              className="hero-cta"
              style={{
                display: 'inline-block',
                background: '#EF9F27',
                color: '#0E1A2B',
                padding: '10px 22px',
                borderRadius: 22,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                border: '2px solid #FAC775',
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: 0.2,
              }}
            >
              Читай безкоштовно
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-cta {
          animation: heroCtaBreath 2.5s ease-in-out infinite;
        }
        @keyframes heroCtaBreath {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 159, 39, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 159, 39, 0);
          }
        }
      `}</style>
    </>
  )
}
