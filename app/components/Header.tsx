'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

const FONT_SIZES = [
  { label: 'A',   value: '16px', title: 'Стандартний' },
  { label: 'A+',  value: '20px', title: 'Великий'     },
  { label: 'A++', value: '26px', title: 'Дуже великий' },
]

export default function Header() {
  const [lang, setLang]       = useState('UA')
  const [fontIdx, setFontIdx] = useState(0)
  const [eyeCare, setEyeCare] = useState(false)
  const { isNight, toggle: toggleNight } = useTheme()

  useEffect(() => {
    document.documentElement.style.setProperty('--base-font-size', FONT_SIZES[fontIdx].value)
    localStorage.setItem('balabony-font-size', String(fontIdx))
  }, [fontIdx])

  useEffect(() => {
    if (eyeCare) {
      document.documentElement.style.setProperty('--text', '#f5deb3')
      document.documentElement.style.setProperty('--muted', '#c4a882')
      document.documentElement.style.setProperty('--white', '#1a1200')
    } else {
      document.documentElement.style.removeProperty('--text')
      document.documentElement.style.removeProperty('--muted')
      document.documentElement.style.removeProperty('--white')
    }
    localStorage.setItem('balabony-eyecare', String(eyeCare))
  }, [eyeCare])

  useEffect(() => {
    const savedFont = localStorage.getItem('balabony-font-size')
    const savedEye  = localStorage.getItem('balabony-eyecare')
    if (savedFont) setFontIdx(parseInt(savedFont))
    if (savedEye === 'true') setEyeCare(true)
  }, [])

  return (
    <>
    <style>{`
      .baly-nav { display: flex; align-items: center; gap: 2px; flex: 1; min-width: 0; justify-content: center; overflow: hidden; }
      .baly-nav-link { font-size: 13px; font-weight: 600; color: var(--text); text-decoration: none; padding: 6px 10px; border-radius: 8px; font-family: 'Montserrat', sans-serif; white-space: nowrap; }
      .baly-try { font-size: 12px; font-weight: 700; background: #F5A623; color: #081420; padding: 7px 14px; border-radius: 8px; text-decoration: none; font-family: 'Montserrat', sans-serif; white-space: nowrap; margin-left: 6px; }
      @media (max-width: 820px) { .baly-nav-link { font-size: 11px; padding: 5px 7px; } .baly-try { font-size: 10px; padding: 6px 9px; margin-left: 3px; } }
      @media (max-width: 640px) { .baly-nav-link { font-size: 10px; padding: 4px 5px; } .baly-try { font-size: 9px; padding: 5px 7px; margin-left: 2px; } }
      @media (max-width: 560px) { .baly-lang { display: none !important; } .baly-eye { display: none !important; } }
    `}</style>
    <header style={{
      background: 'var(--white)', borderBottom: '1px solid var(--border)',
      padding: '0 4%', height: 56, display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <a href="#" style={{
        fontFamily: "'Comfortaa', cursive", fontSize: 22, fontWeight: 700,
        color: 'var(--accent-gold)', textDecoration: 'none', flexShrink: 0,
      }}>
        Balabony<sup style={{ fontSize: 9, color: 'var(--accent-gold)' }}>®</sup>
      </a>

      {/* Navigation */}
      <nav className="baly-nav">
        {[
          { label: 'Історії',  href: '#reader' },
          { label: 'Серіали',  href: '#' },
          { label: 'Ігри',     href: '#' },
        ].map(item => (
          <a key={item.label} href={item.href} className="baly-nav-link">
            {item.label}
          </a>
        ))}
      </nav>

      {/* Права частина — жорстко в один рядок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'nowrap' }}>

        {/* Language */}
        <div className="baly-lang" style={{ display: 'flex', gap: 2 }}>
          {['UA', 'EN', 'DE'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              fontSize: 10, fontWeight: 700, padding: '4px 7px',
              border: '1px solid var(--border)', borderRadius: 6,
              background: lang === l ? 'var(--dark)' : 'transparent',
              color: lang === l ? '#fff' : 'var(--muted)', cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif"
            }}>{l}</button>
          ))}
        </div>

        {/* Eye Care */}
        <button
          className="baly-eye"
          onClick={() => setEyeCare(e => !e)}
          title="Режим захисту зору"
          style={{
            fontSize: 11, fontWeight: 600,
            background: eyeCare ? '#c8860a' : 'rgba(200,134,10,0.12)',
            border: `1px solid ${eyeCare ? '#c8860a' : 'rgba(200,134,10,0.3)'}`,
            color: eyeCare ? '#fff' : '#c8860a',
            padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
            fontFamily: "'Montserrat', sans-serif",
            display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Захист
        </button>

        {/* Day/Night toggle */}
        <button
          onClick={toggleNight}
          title={isNight ? 'Денний режим' : 'Нічний режим'}
          style={{
            width: 54, height: 28, borderRadius: 14, position: 'relative',
            background: isNight ? '#1a2e4a' : '#f0e6cc',
            border: `1.5px solid ${isNight ? 'rgba(245,166,35,0.3)' : 'rgba(245,166,35,0.55)'}`,
            cursor: 'pointer', flexShrink: 0, transition: 'background 0.3s',
            padding: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: isNight ? 3 : 25,
            width: 20, height: 20, borderRadius: '50%',
            background: '#F5A623',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, lineHeight: 1,
            transition: 'left 0.28s cubic-bezier(.4,0,.2,1)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
          }}>
            {isNight ? '🌙' : '☀️'}
          </span>
        </button>


      </div>
    </header>
    </>
  )
}
