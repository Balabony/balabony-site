'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

const GOLD = 'var(--accent-gold)'
const FONT = "'Montserrat', Arial, sans-serif"

export interface NextEpisode {
  season: number
  number: number
  teaser: string            // інтрига наступної серії, без спойлера
  coverUrl?: string
  releaseDate?: string      // ISO-дата релізу; якщо в майбутньому — показуємо відлік
  readUrl?: string          // якщо серія вже доступна
}

export interface EpisodeCliffhangerProps {
  hook?: string             // кліфхенгер-рядок поточної серії
  next?: NextEpisode
  allSeriesUrl?: string     // посилання на всі серії
}

type Remaining = { days: number; hours: number; minutes: number } | null

function diffToParts(ms: number): Remaining {
  if (ms <= 0) return null
  const totalMin = Math.floor(ms / 60000)
  return {
    days: Math.floor(totalMin / 1440),
    hours: Math.floor((totalMin % 1440) / 60),
    minutes: totalMin % 60,
  }
}

// SSR-безпечний відлік: рахуємо лише на клієнті після монтування
function useCountdown(target?: string): { ready: boolean; left: Remaining } {
  const [state, setState] = useState<{ ready: boolean; left: Remaining }>({ ready: false, left: null })

  useEffect(() => {
    if (!target) {
      setState({ ready: true, left: null })
      return
    }
    const t = new Date(target).getTime()
    if (Number.isNaN(t)) {
      setState({ ready: true, left: null })
      return
    }
    const tick = () => setState({ ready: true, left: diffToParts(t - Date.now()) })
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [target])

  return state
}

function CountBox({ value, label, fg }: { value: number; label: string; fg: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 62 }}>
      <div style={{
        fontSize: 30, fontWeight: 800, color: GOLD, fontFamily: FONT, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: fg, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', fontFamily: FONT, marginTop: 6 }}>
        {label}
      </div>
    </div>
  )
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export default function EpisodeCliffhanger({ hook, next, allSeriesUrl = '/series' }: EpisodeCliffhangerProps) {
  const { colors } = useTheme()
  const { ready, left } = useCountdown(next?.releaseDate)

  const cardStyle: React.CSSProperties = {
    border: `1.5px solid ${GOLD}`,
    borderRadius: 18,
    background: colors.cardBg,
    padding: '28px 24px',
    boxShadow: '0 6px 32px rgba(239,159,39,0.14)',
  }
  const kicker: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 2.5,
    textTransform: 'uppercase', fontFamily: FONT, marginBottom: 12,
  }
  const ctaPrimary: React.CSSProperties = {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box',
    background: GOLD, color: '#081420',
    padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: FONT,
    textDecoration: 'none', boxShadow: '0 4px 18px rgba(239,159,39,0.38)',
  }
  const ctaGhost: React.CSSProperties = {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, width: '100%', boxSizing: 'border-box',
    background: 'transparent', color: colors.fg,
    padding: '13px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: FONT,
    textDecoration: 'none', border: `1.5px solid ${GOLD}`,
  }

  // Який стан показуємо
  const hasFutureRelease = ready && left !== null
  const nextAvailable = Boolean(next?.readUrl) && (!next?.releaseDate || (ready && left === null))

  return (
    <section style={{ background: colors.bg, padding: '8px 20px 48px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={cardStyle}>

          <div style={kicker}>Далі буде…</div>

          {hook && (
            <p style={{
              fontSize: 20, fontWeight: 800, color: colors.fg, fontFamily: FONT,
              lineHeight: 1.4, margin: '0 0 20px', wordBreak: 'break-word',
            }}>
              {hook}
            </p>
          )}

          {next && (
            <div>
              {/* Обкладинка-банер 16:9 з підписом «Сезон · Серія» */}
              <div style={{
                position: 'relative', width: '100%', aspectRatio: '16 / 9',
                borderRadius: 12, border: `1.5px solid ${GOLD}`, overflow: 'hidden',
                background: '#16243a',
              }}>
                {next.coverUrl && (
                  <img
                    src={next.coverUrl}
                    alt={`Сезон ${next.season} · Серія ${next.number}`}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                      filter: hasFutureRelease ? 'saturate(0.85)' : 'none',
                    }}
                  />
                )}
                <span style={{
                  position: 'absolute', left: 12, bottom: 12,
                  background: 'rgba(8,20,32,0.82)', color: GOLD,
                  fontSize: 12, fontWeight: 700, fontFamily: FONT,
                  padding: '5px 11px', borderRadius: 9,
                  backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
                }}>
                  Сезон {next.season} · Серія {next.number}
                </span>
              </div>

              {/* Інтрига наступної серії */}
              {next.teaser && (
                <p style={{ fontSize: 16, fontWeight: 600, color: colors.fg, fontFamily: FONT, lineHeight: 1.65, margin: '16px 0 0' }}>
                  {next.teaser}
                </p>
              )}

              {/* Стан 1: відлік до релізу */}
              {hasFutureRelease && left && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: colors.fg, opacity: 0.7, letterSpacing: 1, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 10 }}>
                    До нової серії
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                    <CountBox value={left.days} label={plural(left.days, 'день', 'дні', 'днів')} fg={colors.fg} />
                    <CountBox value={left.hours} label="год" fg={colors.fg} />
                    <CountBox value={left.minutes} label="хв" fg={colors.fg} />
                  </div>
                </div>
              )}

              {/* Стан 2: наступна серія вже доступна — кнопка на всю ширину */}
              {nextAvailable && next.readUrl && (
                <a href={next.readUrl} style={{ ...ctaPrimary, marginTop: 18 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#081420" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                  </svg>
                  Читати Серію {next.number}
                </a>
              )}
            </div>
          )}

          {/* Стан 3: наступної ще нема */}
          {!next && (
            <p style={{ fontSize: 15, color: colors.muted, fontFamily: FONT, lineHeight: 1.7, margin: '0 0 20px' }}>
              Продовження готується. Слідкуйте за новими серіями.
            </p>
          )}

          {/* «Усі серії» показуємо лише тоді, коли головної кнопки нема:
              інакше поруч стоять два однакові виходи і головна дія
              («Читати Серію N») розмивається. Внизу сторінки серії
              вже є «Більше епізодів →». */}
          {!nextAvailable && (
            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href={allSeriesUrl} style={ctaGhost}>Усі серії →</a>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
