export default function Hero() {
  const navItems = [
    { label: 'ІСТОРІЇ', href: '/stories' },
    { label: 'СЕРІЇ', href: '/episodes' },
    { label: 'ІГРИ', href: '/games' },
    { label: 'КАЗКИ', href: '/stories?genre=Казка' },
  ]

  return (
    <>
      <div
        style={{
          background:
            'linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%)',
          padding: '28px 5% 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          {/* Внутрішня навігація Hero */}
          <nav
            aria-label="Розділи Балабонів"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              flexWrap: 'nowrap',
              marginBottom: 28,
            }}
          >
            {navItems.map((item, i) => (
              <span
                key={item.label}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      color: 'rgba(239,159,39,0.4)',
                      fontSize: 12,
                    }}
                  >
                    ·
                  </span>
                )}
                <a
                  href={item.href}
                  style={{
                    color: '#EF9F27',
                    fontWeight: 700,
                    fontSize: 12,
                    textDecoration: 'none',
                    fontFamily: "'Montserrat', sans-serif",
                    letterSpacing: 1,
                    whiteSpace: 'nowrap',
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

            <div style={{ marginTop: 4 }}>
              <a
                href="/accessibility"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: '#EF9F27',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: 1,
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(239,159,39,0.5)',
                  paddingBottom: 2,
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="4" r="1.6" fill="currentColor" stroke="none" />
                  <path d="M5 8h14" />
                  <path d="M12 8v6" />
                  <path d="M9 20l3-6 3 6" />
                </svg>
                ДОСТУПНІСТЬ
              </a>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
