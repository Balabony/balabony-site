'use client'

import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import ShareButtons from './ShareButtons'
import { trackStoryEvent } from '@/lib/analytics'

const GOLD = '#F5A623'
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
          <div style={{ width: 42, height: 42, borderRadius: 11, background: `${GOLD}1A`, border: `1px solid ${GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                <div style={{ display: 'flex' }}>

                  {/* Cover — clickable, clean photo + white border via CSS outline */}
                  <div
                    onClick={() => toggle(s.id)}
                    style={{ position: 'relative', flexShrink: 0, width: 100, cursor: 'pointer' }}
                  >
                    <img
                      src={s.coverUrl}
                      alt={s.title}
                      onError={e => { (e.target as HTMLImageElement).src = '/og-image.jpg' }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {/* white border frame over photo */}
                    <div style={{ position: 'absolute', inset: 5, border: '1.5px solid rgba(255,255,255,0.75)', borderRadius: 2, pointerEvents: 'none' }} />
                    {/* audio badge */}
                    <span style={{
                      position: 'absolute', bottom: 6, left: 6,
                      background: s.hasAudio ? GOLD : 'rgba(0,0,0,0.6)',
                      color: s.hasAudio ? '#081420' : '#8CA0B8',
                      fontSize: 9, fontWeight: 800, fontFamily: FONT, padding: '2px 6px', borderRadius: 20,
                      border: s.hasAudio ? 'none' : '1px solid #445566',
                    }}>
                      {s.hasAudio ? '🎧' : '⏳'}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: GOLD, fontWeight: 600, fontFamily: FONT }}>
                      {label || `С${s.season} · Серія ${s.number}`}
                    </div>
                    <div
                      onClick={() => toggle(s.id)}
                      style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', fontFamily: FONT, lineHeight: 1.35, wordBreak: 'break-word', paddingLeft: 4, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 6 }}
                    >
                      <span style={{ flex: 1 }}>{s.title}</span>
                      <ChevronIcon open={isOpen} />
                    </div>
                    <div style={{ fontSize: 11, color: '#8CA0B8', fontFamily: FONT, marginTop: 'auto' }}>
                      {s.hasAudio ? '🎧 Аудіо доступно' : '⏳ Аудіо готується'}
                    </div>
                    <ShareButtons url={`https://balabony.com${s.url}`} title={s.title} />
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
                    borderTop: `1px solid ${GOLD}33`,
                    background: 'rgba(0,0,0,0.25)',
                  }}>
                    {/* Title */}
                    <div style={{ fontSize: 18, fontWeight: 800, color: GOLD, fontFamily: FONT, lineHeight: 1.2, marginBottom: 6 }}>
                      {s.title}
                    </div>
                    {/* Season/episode label */}
                    {label && (
                      <div style={{ fontSize: 11, color: '#8CA0B8', fontFamily: FONT, letterSpacing: 0.5, marginBottom: 10 }}>
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
    </section>
  )
}
