'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import AuthMenu from './AuthMenu'

const FONT_SIZES = [
  { label: 'A',   value: '16px', title: 'Стандартний' },
  { label: 'A+',  value: '20px', title: 'Великий'     },
  { label: 'A++', value: '26px', title: 'Дуже великий' },
]

export default function Header() {
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
    <header style={{
      background: 'var(--white)', borderBottom: '1px solid var(--border)',
      padding: '0 4%', height: 56, display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', position: 'sticky', top: 0, zIndex: 100,
    }}>

      {/* Logo */}
      <a href="/" style={{
        fontFamily: "'Comfortaa', cursive", fontSize: 22, fontWeight: 700,
        color: 'var(--accent-gold)', textDecoration: 'none', flexShrink: 0,
      }}>
        Balabony<sup style={{ fontSize: 9, color: 'var(--accent-gold)' }}>®</sup>
      </a>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'nowrap' }}>

        {/* Free CTA — desktop only */}
        <a href="/free"
          className="header-free-cta baly-eye-hide-mobile"
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '6px 14px',
            borderRadius: 100,
            background: 'linear-gradient(135deg, #f0a500, #ffb820)',
            color: '#1a1f2e',
            textDecoration: 'none',
            fontFamily: "'Montserrat', sans-serif",
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          Безкоштовно
        </a>

        {/* Language switcher — links to /support with corresponding lang */}
        <div style={{ display: 'flex', gap: 2 }}>
          <a
            href="/"
            title="Українська · головна"
            style={{
              fontSize: 11, fontWeight: 700, padding: '5px 8px',
              border: '1px solid var(--border)', borderRadius: 6,
              background: 'var(--dark)', color: '#fff',
              textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
              lineHeight: 1, display: 'inline-block',
            }}
          >UA</a>
          <a
            href="/support?lang=en"
            title="English — Donate page"
            style={{
              fontSize: 11, fontWeight: 700, padding: '5px 8px',
              border: '1px solid var(--border)', borderRadius: 6,
              background: 'transparent', color: 'var(--muted)',
              textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
              lineHeight: 1, display: 'inline-block',
            }}
          >EN</a>
          <a
            href="/support?lang=de"
            title="Deutsch — Spendenseite"
            style={{
              fontSize: 11, fontWeight: 700, padding: '5px 8px',
              border: '1px solid var(--border)', borderRadius: 6,
              background: 'transparent', color: 'var(--muted)',
              textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
              lineHeight: 1, display: 'inline-block',
            }}
          >DE</a>
        </div>

        {/* Auth menu */}


        <AuthMenu />



        {/* Eye Care */}
        <button
          className="baly-eye baly-eye-hide-mobile"
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


