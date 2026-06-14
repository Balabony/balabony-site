'use client'

import { useTheme } from '../context/ThemeContext'
import ShareButtons from './ShareButtons'
import { AudioWaveIcon, ReadIcon } from './AudioBadge'

const GOLD = 'var(--accent-gold)'
const FONT = "'Montserrat', Arial, sans-serif"

export interface Episode {
  number: number
  season: number
  title: string
  coverUrl: string
  teaser: string
  hasAudio: boolean
  readUrl: string
  audioUrl?: string
}

export default function LatestEpisodeHero({ episode }: { episode: Episode }) {
  const { colors, isNight } = useTheme()

  return (
    <>
    <style>{`
      .ep-hero-grid { display: grid; grid-template-columns: 320px 1fr; gap: 40px; align-items: center; }
      @media (max-width: 680px) {
        .ep-hero-grid { grid-template-columns: 1fr; gap: 24px; }
        .ep-hero-cover { max-width: 260px; margin: 0 auto; }
      }
    `}</style>
    <section style={{ background: colors.bg, padding: '52px 20px', overflow: 'hidden' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div className="ep-hero-grid">

          {/* Cover */}
          <div className="ep-hero-cover" style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: `0 8px 48px rgba(239,159,39,0.22), 0 2px 12px rgba(0,0,0,0.4)`, border: `1.5px solid ${GOLD}`, flexShrink: 0 }}>
            <img src={episode.coverUrl} alt={episode.title}
              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', top: 14, left: 14, background: GOLD, color: '#081420', fontSize: 11, fontWeight: 800, fontFamily: FONT, padding: '4px 11px', borderRadius: 20, letterSpacing: 0.5 }}>
              Сезон {episode.season} · Серія {episode.number}
            </div>
          </div>

          {/* Text */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 10 }}>
              Остання серія
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: colors.fg, fontFamily: FONT, lineHeight: 1.2, marginBottom: 14, margin: '0 0 14px', wordBreak: 'break-word' }}>
              {episode.title}
            </h2>
            <p style={{ fontSize: 15, color: colors.muted, fontFamily: FONT, lineHeight: 1.75, margin: '0 0 28px' }}>
              {episode.teaser}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
              <a href={episode.readUrl}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: GOLD, color: '#081420', padding: '13px 26px', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: FONT, textDecoration: 'none', boxShadow: '0 4px 18px rgba(239,159,39,0.38)' }}>
                <ReadIcon size={16} color="#081420" />
                Читати
              </a>

              {episode.hasAudio ? (
                <a href={episode.audioUrl}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: GOLD, padding: '13px 26px', borderRadius: 12, border: `2px solid ${GOLD}`, fontSize: 14, fontWeight: 700, fontFamily: FONT, textDecoration: 'none' }}>
                  <AudioWaveIcon size={16} color={GOLD} />
                  Слухати
                </a>
              ) : (
                <button disabled
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: isNight ? '#445566' : '#9BA8B5', padding: '13px 26px', borderRadius: 12, border: `2px solid ${isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`, fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'not-allowed' }}>
                  <AudioWaveIcon size={16} color="currentColor" />
                  Аудіо готується
                </button>
              )}
            </div>

            <ShareButtons url={`https://balabony.com${episode.readUrl}`} title={episode.title} />
          </div>
        </div>
      </div>
    </section>
    </>
  )
}
