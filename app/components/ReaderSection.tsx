'use client'

import { useState } from 'react'

const PARAGRAPHS = [
  { id: 'p1', text: 'Дід Панас повільно відкрив свій синій блокнот. Папір зашурхотів, наче листя під ногами в осінньому лісі. Тут панував спокій. Текст на цій сторінці ніколи не рухається сам — він чекає на ваші очі.' },
  { id: 'p2', text: 'Баба Ганя принесла духмяний чай. «Ти знову в своїх думках?» — усміхнулася вона. Дід мовчав, бо знав: найкращі історії народжуються в тиші.' },
  { id: 'p3', text: 'Але Панас не відповідав. Він дивився на зашифрований запис, який зробив ще тридцять років тому, коли над селом пролетіла таємнича вогняна куля.' },
  { id: 'p4', text: '«Ганю,» — нарешті промовив він тихо, — «здається, я знайшов відповідь. Все було у цьому блокноті весь цей час...»' },
]

const EPISODES = Array.from({ length: 20 }, (_, i) => i + 1)
const FREE_EPISODES = [1, 2, 3]

export default function ReaderSection() {
  const [fontSize, setFontSize] = useState(24)
  const [isSerif, setIsSerif] = useState(true)
  const [zenMode, setZenMode] = useState(false)
  const [activeP, setActiveP] = useState('p1')
  const [currentEp, setCurrentEp] = useState(1)

  return (
    <section id="reader" style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1a2f4a', border: '1.5px solid rgba(245,166,35,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
            <path d="M14 38 L14 18 Q28 13 28 22 Q28 13 42 18 L42 38 Q28 33 28 41 Q28 33 14 38 Z" stroke="#f5a623" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
            <line x1="28" y1="22" x2="28" y2="41" stroke="#f5a623" strokeWidth="1.5" strokeDasharray="3,2.5"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: "'Montserrat', Arial, sans-serif" }}>ЧИТАЙТЕ</div>
        </div>
      </div>

      <div style={{ background: 'var(--white)', border: '1.5px solid #f5a623', borderRadius: 20, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Шрифт:</span>
          {[
            { label: 'A+', action: () => setFontSize(s => Math.min(s + 2, 36)) },
            { label: 'A−', action: () => setFontSize(s => Math.max(s - 2, 14)) },
          ].map(b => (
            <button key={b.label} onClick={b.action} style={{
              padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8,
              cursor: 'pointer', background: 'transparent', color: 'var(--text)',
              fontSize: 16, fontWeight: 600, fontFamily: "'Montserrat', sans-serif", minHeight: 44
            }}>{b.label}</button>
          ))}
          <button onClick={() => setIsSerif(s => !s)} style={{
            padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8,
            cursor: 'pointer', background: isSerif ? 'var(--dark)' : 'transparent',
            color: isSerif ? '#fff' : 'var(--text)', fontSize: 14, fontWeight: 600,
            fontFamily: "'Montserrat', sans-serif", minHeight: 44
          }}>
            {isSerif ? 'З зарубками (Книжковий)' : 'Без зарубок (Сучасний)'}
          </button>
          <button onClick={() => setZenMode(z => !z)} aria-label="Zen-режим" style={{
            padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8,
            cursor: 'pointer', background: 'transparent', color: 'var(--text)', minHeight: 44
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {zenMode
                ? <path d="M5 1v4H1M9 1v4h4M1 9h4v4M13 9H9v4" />
                : <path d="M1 5V1h4M9 1h4v4M1 9v4h4M13 9v4H9" />}
            </svg>
          </button>
          <span style={{
            marginLeft: 'auto', fontSize: 10, background: 'var(--accent-gold)', color: '#fff',
            padding: '3px 10px', borderRadius: 20, fontWeight: 700
          }}>Офлайн</span>
        </div>

        {/* Story header */}
        <div style={{
          padding: '24px 28px 0',
          background: 'linear-gradient(135deg, var(--bg-deep) 0%, #1e293b 50%, #0f172a 100%)',
          position: 'relative', minHeight: 160, display: 'flex', alignItems: 'flex-end'
        }}>
          <div style={{ paddingBottom: 20 }}>
            <h2 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, color: '#f8fafc', lineHeight: 1.3 }}>
              Синій блокнот та таємниця Балабонів
            </h2>
            <span style={{
              marginTop: 8, display: 'inline-block', fontSize: 10, fontWeight: 700,
              background: 'var(--accent-gold)', color: '#fff', padding: '3px 10px', borderRadius: 20
            }}>БЕЗКОШТОВНО</span>
          </div>
        </div>

        {/* Episodes bar */}
        <div style={{ padding: '16px 28px', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
            Серії сезону <span style={{ color: 'var(--accent-gold)' }}>(1 Сезон = 20 Серій)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EPISODES.map(ep => {
              const isFree = FREE_EPISODES.includes(ep)
              const isActive = ep === currentEp
              return (
                <button
                  key={ep}
                  onClick={() => setCurrentEp(ep)}
                  style={{
                    padding: '8px 10px', borderRadius: 8, minWidth: 44, minHeight: 44,
                    border: `1.5px solid ${isActive ? 'var(--accent-gold)' : isFree ? 'var(--accent-gold)' : 'var(--border)'}`,
                    background: isActive ? 'var(--accent-gold)' : isFree ? 'rgba(239,159,39,0.12)' : 'var(--white)',
                    color: isActive ? '#fff' : isFree ? 'var(--accent-gold)' : 'var(--muted)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Montserrat', sans-serif"
                  }}>
                  {isFree ? `${ep} ★` : ep}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '20px 28px 28px',
            fontSize: fontSize,
            lineHeight: 2.0,
            fontFamily: isSerif ? "'Lora', serif" : "'Montserrat', sans-serif"
          }}
          onClick={(e) => {
            const el = (e.target as HTMLElement).closest('p')
            if (el?.id) setActiveP(el.id)
          }}
        >
          {PARAGRAPHS.map(p => (
            <p
              key={p.id}
              id={p.id}
              style={{
                marginBottom: 18, padding: '6px 10px', borderRadius: 6,
                background: activeP === p.id ? 'var(--highlight)' : 'transparent',
                color: activeP === p.id ? '#1a1a1a' : 'inherit',
                fontWeight: activeP === p.id ? 500 : 400,
                cursor: 'pointer'
              }}
            >
              {p.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
