'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

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

const IconGames = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={21} height={21}>
    <circle cx="8" cy="8" r="5" />
    <circle cx="15" cy="15" r="5" fill="currentColor" stroke="none" />
  </svg>
)

const TABS: Tab[] = [
  { href: '/',         label: 'Р“РѕР»РѕРІРЅР°', icon: IconHome,     isActive: (p) => p === '/' },
  { href: '/sitemap',  label: 'Р РѕР·РґС–Р»Рё', icon: IconSections, isActive: (p) => p.startsWith('/sitemap') },
  { href: '/games', label: 'Ігри', icon: IconGames, isActive: (p) => p.startsWith('/games') },
  { href: '/episodes', label: 'Р§РёС‚Р°С‚Рё',  icon: IconRead,     isActive: (p) => p.startsWith('/episodes') || p.startsWith('/series') || p.startsWith('/stories') },
]

export default function BottomBar() {
  const pathname = usePathname() || '/'

  const readerSlug = pathname.startsWith('/stories/')
    ? pathname.split('/')[2] || ''
    : ''
  const [nav, setNav] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null })

  useEffect(() => {
    if (!readerSlug) { setNav({ prev: null, next: null }); return }
    let alive = true
    fetch('/api/reader-nav?slug=' + encodeURIComponent(readerSlug))
      .then(r => r.json())
      .then(d => { if (alive) setNav({ prev: d.prev ?? null, next: d.next ?? null }) })
      .catch(() => { if (alive) setNav({ prev: null, next: null }) })
    return () => { alive = false }
  }, [readerSlug])

  const showArrows = !!readerSlug

  return (
    <>
      {/* РўС–Р»СЊРєРё РјРѕР±С–Р»СЊРЅРёР№; РЅР° РґРµСЃРєС‚РѕРїС– С…РѕРІР°С”РјРѕ (С‚Р°Рј РЅР°РІС–РіР°С†С–СЏ Сѓ С€Р°РїС†С–).
          --bb-offset РїС–РґРЅС–РјР°С” С„С–РєСЃРѕРІР°РЅРёР№ AudioPlayer РЅР°Рґ Р±Р°СЂРѕРј РЅР° РјРѕР±С–Р»СЊРЅРѕРјСѓ. */}
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
        aria-label="РќРёР¶РЅСЏ РЅР°РІС–РіР°С†С–СЏ"
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

        {showArrows && (
          <>
            <span aria-hidden style={{ width: 1, alignSelf: 'center', height: 26, background: 'rgba(255,255,255,0.10)', margin: '0 2px' }} />
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 4, paddingRight: 6 }}>
              {[
                { slug: nav.prev, left: true,  label: 'РџРѕРїРµСЂРµРґРЅСЏ' },
                { slug: nav.next, left: false, label: 'РќР°СЃС‚СѓРїРЅР°' },
              ].map(({ slug, left, label }) => {
                const icon = (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
                    <path d={left ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
                  </svg>
                )
                const box = {
                  width: 40, height: 40, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                }
                return slug ? (
                  <a
                    key={label}
                    href={`/stories/${slug}`}
                    aria-label={label}
                    style={{ ...box, color: GOLD, background: 'rgba(239,159,39,0.12)', border: '1px solid rgba(239,159,39,0.30)', textDecoration: 'none' }}
                  >
                    {icon}
                  </a>
                ) : (
                  <span key={label} aria-hidden style={{ ...box, color: 'rgba(245,240,232,0.22)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {icon}
                  </span>
                )
              })}
            </div>
          </>
        )}
      </nav>
    </>
  )
}
