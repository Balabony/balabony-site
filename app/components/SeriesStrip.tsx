'use client'

import { useTheme } from '../context/ThemeContext'
import ShareButtons from './ShareButtons'

const GOLD = '#F5A623'
const CARD_BG = '#081420'
const FONT = "'Montserrat', Arial, sans-serif"

export interface SeriesCard {
  id: string
  number: number
  season: number
  title: string
  coverUrl: string
  hasAudio: boolean
  url: string
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

export default function SeriesStrip({ series }: { series: SeriesCard[] }) {
  const { colors } = useTheme()

  return (
    <section style={{ background: colors.bg, padding: '44px 0' }}>
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

        {/* Horizontal scroll strip */}
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: `${GOLD}44 transparent` }}>
          {series.map(s => (
            <div key={s.id} style={{ flexShrink: 0, width: 195, border: `1.5px solid ${GOLD}`, borderRadius: 14, overflow: 'hidden', background: CARD_BG, display: 'flex', flexDirection: 'column' }}>

              {/* Cover */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={s.coverUrl} alt={s.title} style={{ width: '100%', height: 155, objectFit: 'cover', display: 'block' }} />
                <span style={{ position: 'absolute', top: 8, right: 8, background: s.hasAudio ? GOLD : 'rgba(0,0,0,0.6)', color: s.hasAudio ? '#081420' : '#8CA0B8', fontSize: 10, fontWeight: 800, fontFamily: FONT, padding: '3px 8px', borderRadius: 20, border: s.hasAudio ? 'none' : '1px solid #445566' }}>
                  {s.hasAudio ? '🎧 Аудіо' : '⏳ Скоро'}
                </span>
              </div>

              {/* Info */}
              <div style={{ padding: '10px 11px 11px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ fontSize: 10, color: GOLD, fontWeight: 600, fontFamily: FONT }}>С{s.season} · Серія {s.number}</div>
                <a href={`https://balabony.com${s.url}`} style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', fontFamily: FONT, lineHeight: 1.35, textDecoration: 'none', flex: 1 }}>
                  {s.title}
                </a>
                <ShareButtons url={`https://balabony.com${s.url}`} title={s.title} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
