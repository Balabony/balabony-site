'use client'

import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { trackStoryEvent } from '@/lib/analytics'
import AudioBadge from './AudioBadge'

const GOLD = 'var(--accent-gold)'
const CARD_BG = '#0f1e3a'
const FONT = "'Montserrat', Arial, sans-serif"

export interface SeriesCard {
  id: string
  number: number
  season: number
  title: string
  coverUrl: string
  hasAudio: boolean
  url: string
  description?: string
  durationMinutes?: number
}

// "s3-ep46" → "Сезон 3 · Серія 46"
function parseSeriesLabel(id: string): string {
  const m = id.match(/s(\d+)[_-]ep(\d+)/i)
  return m ? `Сезон ${m[1]} · Серія ${m[2]}` : ''
}

function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="2" width="13" height="18" rx="2" stroke={GOLD} strokeWidth="1.5"/>
      <rect x="3" y="2" width="3.5" height="18" rx="1" fill={GOLD} opacity="0.45"/>
      <path d="M9.5 7h4M9.5 11h4M9.5 15h2.5" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path d="M2.5 5L7 9.5L11.5 5" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function SeriesStrip({ series }: { series: SeriesCard[] }) {
  const { colors } = useTheme()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id)

  return (
    <section style={{ background: colors.bg, padding: '20px 0' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: `rgba(239,159,39,0.10)`, border: `1px solid rgba(239,159,39,0.27)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookIcon />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: FONT, lineHeight: 1 }}>Балабони</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: colors.fg, fontFamily: FONT, lineHeight: 1.2 }}>Серії Балабонів</div>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {series.map(s => {
            const isOpen = expandedId === s.id
            const label  = parseSeriesLabel(s.id)

            return (
              <div
                key={s.id}
                style={{ border: `1.5px solid ${GOLD}`, borderRadius: 14, overflow: 'hidden', background: CARD_BG }}
              >
                {/* ── Card row ── */}
                <div className="ss-row">

                  {/* Cover — clickable, clean photo + gold frame */}
                  <div onClick={() => toggle(s.id)} className="ss-cover">
                    <div className="ss-frame">
                      <img
                        src={s.coverUrl}
                        alt={s.title}
                        onError={e => { (e.target as HTMLImageElement).src = '/og-image.jpg' }}
                        className="ss-img"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="ss-info">
                    <div style={{ fontSize: 10, color: GOLD, fontWeight: 600, fontFamily: FONT }}>
                      {label || `Сезон ${s.season} · Серія ${s.number}`}
                    </div>
                    <div
                      onClick={() => toggle(s.id)}
                      style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', fontFamily: FONT, lineHeight: 1.3, wordBreak: 'normal', overflowWrap: 'break-word', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 6 }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>{s.title}</span>
                      <ChevronIcon open={isOpen} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                      <AudioBadge hasAudio={s.hasAudio} />
                      {s.durationMinutes ? (
                        <span style={{ fontSize: 10, fontWeight: 600, color: GOLD, fontFamily: FONT, border: `1px solid ${GOLD}`, padding: '2px 8px', borderRadius: 20 }}>
                          {s.durationMinutes} хв
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* ── Expansion panel ── */}
                <div style={{
                  maxHeight: isOpen ? '260px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                }}>
                  <div style={{
                    padding: '16px 18px 20px',
                    borderTop: `1px solid rgba(239,159,39,0.20)`,
                    background: 'rgba(0,0,0,0.25)',
                  }}>
                    {/* Title */}
                    <div style={{ fontSize: 18, fontWeight: 800, color: GOLD, fontFamily: FONT, lineHeight: 1.2, marginBottom: 6 }}>
                      {s.title}
                    </div>
                    {/* Season/episode label */}
                    {label && (
                      <div style={{ fontSize: 11, color: 'var(--on-dark-muted)', fontFamily: FONT, letterSpacing: 0.5, marginBottom: 10 }}>
                        {label}
                      </div>
                    )}
                    {/* Description */}
                    {s.description && (
                      <p style={{ fontSize: 13, color: '#c8d4e8', fontFamily: FONT, lineHeight: 1.65, margin: '0 0 16px' }}>
                        {s.description}
                      </p>
                    )}
                    {/* Action button */}
                    <a
                      href={`https://balabony.com${s.url}`}
                      onClick={() => trackStoryEvent(s.id, s.title, 'open')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        background: GOLD, color: '#081420',
                        padding: '9px 20px', borderRadius: 20,
                        fontSize: 13, fontWeight: 700, fontFamily: FONT,
                        textDecoration: 'none',
                      }}
                    >
                      {s.hasAudio ? '🎧 Слухати' : '📖 Читати'}
                    </a>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .ss-row { display: flex; flex-direction: row; align-items: stretch; }
        .ss-cover { flex-shrink: 0; align-self: stretch; cursor: pointer; padding: 8px; display: flex; }
        .ss-frame { width: 96px; border: 1.5px solid ${GOLD}; border-radius: 8px; overflow: hidden; display: flex; }
        .ss-img { width: 100%; height: 100%; object-fit: cover; object-position: center 22%; display: block; }
        .ss-info { padding: 12px 14px; flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        @media (max-width: 600px) {
          .ss-row { flex-direction: column; }
          .ss-cover { align-self: auto; padding: 8px 8px 0; }
          .ss-frame { width: 100%; aspect-ratio: 3 / 2; }
          .ss-info { padding: 12px 16px 16px; }
        }
      `}</style>
    </section>
  )
}
