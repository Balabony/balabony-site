'use client'

import { useState, useEffect } from 'react'

const FONT_SIZES = [
  { label: 'A',   value: '16px', title: 'Стандартний' },
  { label: 'A+',  value: '20px', title: 'Великий'     },
  { label: 'A++', value: '26px', title: 'Дуже великий' },
]

export default function Header() {
  const [lang, setLang]           = useState('UA')
  const [fontIdx, setFontIdx]     = useState(0)
  const [nightMode, setNightMode] = useState(false)
  const [eyeCare, setEyeCare]     = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty('--base-font-size', FONT_SIZES[fontIdx].value)
    localStorage.setItem('balabony-font-size', String(fontIdx))
  }, [fontIdx])

  useEffect(() => {
    document.body.classList.toggle('dark-mode', nightMode)
    localStorage.setItem('balabony-night', String(nightMode))
  }, [nightMode])

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
    const savedFont  = localStorage.getItem('balabony-font-size')
    const savedNight = localStorage.getItem('balabony-night')
    const savedEye   = localStorage.getItem('balabony-eyecare')
    if (savedFont)  setFontIdx(parseInt(savedFont))
    if (savedNight === 'true') setNightMode(true)
    if (savedEye   === 'true') setEyeCare(true)
  }, [])

  return (
    <header style={{
      background: 'var(--white)', borderBottom: '1px solid var(--border)',
      padding: '0 4%', height: 56, display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', position: 'sticky', top: 0, zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <a href="#" style={{
        fontFamily: "'Comfortaa', cursive", fontSize: 22, fontWeight: 700,
        color: 'var(--accent-gold)', textDecoration: 'none', flexShrink: 0,
      }}>
        Balabony<sup style={{ fontSize: 9, color: 'var(--accent-gold)' }}>®</sup>
      </a>

      {/* Права частина — жорстко в один рядок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'nowrap' }}>

        {/* Language */}
        <div style={{ display: 'flex', gap: 2 }}>
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

        {/* Night mode */}
        <button
          onClick={() => setNightMode(n => !n)}
          title={nightMode ? 'Денний режим' : 'Нічний режим'}
          style={{
            fontSize: 11, fontWeight: 600,
            background: nightMode ? '#ef9f27' : 'var(--bg-deep)',
            border: 'none', color: '#fff',
            padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
            fontFamily: "'Montserrat', sans-serif", whiteSpace: 'nowrap',
          }}
        >
          {nightMode ? '☀️' : '🌙'}
        </button>


      </div>
    </header>
  )
}
