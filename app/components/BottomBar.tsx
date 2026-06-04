'use client'

import { usePathname } from 'next/navigation'

const NAVY = '#0f1e3a'
const GOLD = 'var(--accent-gold)'
const CREAM = '#f5f0e8'
const FONT = "'Montserrat', Arial, sans-serif"

interface Tab {
  href: string
  label: string
  icon: React.ReactNode
  isActive: (p: string) => boolean
}

const IconHome = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={21} height={21}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
)

const IconSections = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" width={21} height={21}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
)

const IconRead = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={21} height={21}>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
    <path d="M5 19.5A1.5 1.5 0 0 1 6.5 18H19v3H6.5A1.5 1.5 0 0 1 5 19.5z" />
  </svg>
)

const TABS: Tab[] = [
  { href: '/',         label: 'Головна', icon: IconHome,     isActive: (p) => p === '/' },
  { href: '/sitemap',  label: 'Розділи', icon: IconSections, isActive: (p) => p.startsWith('/sitemap') },
  { href: '/episodes', label: 'Читати',  icon: IconRead,     isActive: (p) => p.startsWith('/episodes') || p.startsWith('/series') || p.startsWith('/stories') },
]

export default function BottomBar() {
  const pathname = usePathname() || '/'

  return (
    <>
      {/* Тільки мобільний; на десктопі ховаємо (там навігація у шапці).
          --bb-offset піднімає фіксований AudioPlayer над баром на мобільному. */}
      <style>{`
        @media (min-width: 768px) { .bb-root { display: none !important; } }
        @media (max-width: 767px) {
          :root { --bb-offset: calc(56px + env(safe-area-inset-bottom, 0px)); }
          body { padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)); }
        }
        .bb-tab:active { background: rgba(255,255,255,0.05); }
      `}</style>

      <nav
        className="bb-root"
        aria-label="Нижня навігація"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 190,
          background: NAVY,
          borderTop: '0.5px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -6px 22px rgba(0,0,0,0.28)',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          fontFamily: FONT,
        }}
      >
        {TABS.map((tab) => {
          const active = tab.isActive(pathname)
          return (
            <a
              key={tab.href}
              href={tab.href}
              className="bb-tab"
              aria-current={active ? 'page' : undefined}
              onClick={(e) => {
                if (active) {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '9px 0 11px',
                textDecoration: 'none',
                color: CREAM,
                borderRadius: 10,
                transition: 'background 0.15s',
              }}
            >
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  width: 20,
                  height: 3,
                  borderRadius: 2,
                  background: GOLD,
                  opacity: active ? 1 : 0,
                  transition: 'opacity 0.2s',
                }}
              />
              <span style={{ color: CREAM, display: 'flex' }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.2, color: CREAM }}>
                {tab.label}
              </span>
            </a>
          )
        })}
      </nav>
    </>
  )
}
