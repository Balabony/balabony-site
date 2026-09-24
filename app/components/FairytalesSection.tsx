'use client'

import SectionHead from './SectionHead'
import BrandCover from './BrandCover'
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

const GOLD = 'var(--accent-gold)'
const CARD_BG = '#0f1e3a'
const FONT = "'Montserrat', Arial, sans-serif"

// s2070: казка без власної обкладинки отримує брендову обкладинку з назвою,
// як у «Свіжих історіях». Раніше тут стояв /og-image.jpg — загальний банер
// сайту («Балабони · Українські історії…»): він не казав нічого про саму
// казку й займав пів картки.
const hasRealCover = (src?: string | null) => Boolean(src) && !String(src).includes('og-image')

export default function FairytalesSection({ initial }: { initial?: Fairytale[] } = {}) {
  // Готові дані з сервера — щоб казки були в HTML, а не підвантажувалися
  // вже в браузері (тоді пошуковик їх не бачив).
  const [tales, setTales] = useState<Fairytale[] | null>(initial ?? null)

  useEffect(() => {
    if (initial) return
    fetch('/api/stories?genre=' + encodeURIComponent('Казка') + '&limit=3')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((rows: Fairytale[]) => {
        if (Array.isArray(rows)) setTales(rows.slice(0, 3))
        else setTales([])
      })
      .catch(() => setTales([]))
  }, [initial])

  // Поки вантажиться — нічого не показуємо (щоб не миготіло "Скоро")
  if (tales === null) return null
  // Немає казок — секція не рендериться (як і просили: блок зникає коли пусто)
  if (tales.length === 0) return null

  return (
    <section style={{ background: 'var(--dark)', padding: '16px 5% 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <SectionHead
          kicker="Для дітей"
          title="Казки"
          subtitle="Казки й оповідання для дітей"
          href="/fairytales"
          linkLabel="Усі казки"
        />

        {/* Картки */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(275px, 100%), 1fr))',
          gap: 20,
          alignItems: 'stretch',
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
              <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 2', overflow: 'hidden', background: '#000' }}>
                {hasRealCover(t.coverUrl) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={t.coverUrl}
                    alt={t.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <BrandCover title={t.title} shape="wide" />
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT, letterSpacing: 0.3 }}>
                  {t.author}
                </div>
                {/* Назва вже написана на брендовій обкладинці — двічі не повторюємо. */}
                {hasRealCover(t.coverUrl) && (
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: FONT,
                    lineHeight: 1.4,
                  }}>
                    {t.title}
                  </div>
                )}
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
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 8 }}>
                  {t.duration_minutes ? (
                    <span style={{ fontSize: 11, color: GOLD, fontFamily: FONT }}>
                      {t.duration_minutes} хв
                    </span>
                  ) : null}
                  <span style={{
                    marginLeft: 'auto',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: GOLD, color: '#081420',
                    padding: '5px 12px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, fontFamily: FONT,
                    whiteSpace: 'nowrap',
                  }}>
                    Читати →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  )
}

