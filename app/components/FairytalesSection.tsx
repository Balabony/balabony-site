'use client'

import { useEffect, useState } from 'react'

interface Fairytale {
  id: string
  title: string
  author: string
  coverUrl: string
  teaser: string
  url: string
  duration_minutes?: number
}

const GOLD = '#F5A623'
const CARD_BG = '#0f1e3a'
const FONT = "'Montserrat', Arial, sans-serif"

export default function FairytalesSection() {
  const [tales, setTales] = useState<Fairytale[] | null>(null)

  useEffect(() => {
    fetch('/api/stories?genre=' + encodeURIComponent('Казка') + '&limit=2')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Fairytale[]) => {
        if (Array.isArray(rows)) setTales(rows.slice(0, 2))
        else setTales([])
      })
      .catch(() => setTales([]))
  }, [])

  // Поки вантажиться — нічого не показуємо (щоб не миготіло "Скоро")
  if (tales === null) return null
  // Немає казок — секція не рендериться (як і просили: блок зникає коли пусто)
  if (tales.length === 0) return null

  return (
    <section style={{ background: 'var(--dark)', padding: '24px 5%' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h2 style={{
            fontFamily: "'Lora', serif",
            fontSize: 'clamp(28px, 6vw, 44px)',
            fontWeight: 600,
            color: '#fff',
            margin: '0 0 8px',
            letterSpacing: -0.5,
          }}>
            Казки
          </h2>
          <p style={{
            fontSize: 'clamp(14px, 2.5vw, 17px)',
            color: '#94a3b8',
            margin: 0,
            lineHeight: 1.6,
          }}>
            Українські казки
          </p>
        </div>

        {/* Картки */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))',
          gap: 20,
          maxWidth: 700,
          margin: '0 auto',
        }}>
          {tales.map(t => (
            <a
              key={t.id}
              href={t.url}
              style={{
                textDecoration: 'none',
                border: `1.5px solid ${GOLD}`,
                borderRadius: 16,
                overflow: 'hidden',
                background: CARD_BG,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Cover */}
              <div style={{ width: '100%', height: 175, overflow: 'hidden', background: '#000' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.coverUrl}
                  alt={t.title}
                  onError={e => { (e.target as HTMLImageElement).src = '/og-image.jpg' }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>

              {/* Body */}
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT, letterSpacing: 0.3 }}>
                  {t.author}
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  fontFamily: FONT,
                  lineHeight: 1.4,
                  textTransform: 'uppercase',
                }}>
                  {t.title}
                </div>
                <p style={{
                  fontSize: 12,
                  color: '#7A90A8',
                  fontFamily: FONT,
                  lineHeight: 1.65,
                  margin: 0,
                  flexGrow: 1,
                }}>
                  {t.teaser}
                </p>
                {t.duration_minutes && (
                  <div style={{ fontSize: 11, color: GOLD, fontFamily: FONT, marginTop: 4 }}>
                    {t.duration_minutes} хв
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
