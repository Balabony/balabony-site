'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { trackStoryEvent } from '@/lib/analytics'

const GOLD = 'var(--accent-gold)'
const AMBER = '#FFB347'
const CARD_BG = '#0f1e3a'
const FONT = "'Montserrat', Arial, sans-serif"

const STYLES = `
.ts-kicker {
  display: inline-block; font-size: 10px; font-weight: 700; color: #1a3a6b;
  letter-spacing: 2px; text-transform: uppercase; line-height: 1;
  background: rgba(26,58,107,0.12); border: 1px solid rgba(26,58,107,0.55);
  padding: 5px 10px; border-radius: 4px; margin-bottom: 10px;
}
.ts-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease; will-change: transform;
  display: flex; flex-direction: column; background: ${CARD_BG};
  border: 1.5px solid ${AMBER}; border-radius: 16px; overflow: hidden;
  box-shadow: 0 0 14px rgba(255,179,71,0.18); text-decoration: none; color: inherit;
  height: 100%; transform: translateY(0);
}
.ts-card:hover, .ts-card:focus-visible {
  transform: translateY(-6px); box-shadow: 0 0 32px rgba(255,179,71,0.5); outline: none;
}
.ts-card:hover .ts-cover-img, .ts-card:focus-visible .ts-cover-img { transform: scale(1.05); }
.ts-card:hover .ts-title-text, .ts-card:focus-visible .ts-title-text { color: ${AMBER}; }
.ts-cover-img {
  width: 100%; height: 100%; object-fit: cover; object-position: center 40%; transition: transform 0.3s ease; display: block;
}
.ts-teaser {
  font-size: 12.5px; line-height: 1.5; color: rgba(245,240,232,0.7); margin: 0;
  font-family: ${FONT}; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden;
}
@media (prefers-reduced-motion: reduce) {
  .ts-card, .ts-cover-img, .ts-title-text { transition: none; }
  .ts-card:hover, .ts-card:focus-visible { transform: none; }
  .ts-card:hover .ts-cover-img, .ts-card:focus-visible .ts-cover-img { transform: none; }
}
`

interface TyshaItem {
  id: string
  number: number | null
  season?: number | null
  title: string
  cover_url: string | null
  has_audio: boolean
  url: string
  description: string | null
  duration_minutes?: number
}

// Чистить назву серії для вітрини: прибирає службовий префікс «Серія N.» / «Сезон N.»
// і зовнішні лапки, бо «Сезон · Серія» показуємо окремим рядком (як у серіалах Балабонів).
function cleanTitle(raw: string): string {
  let t = (raw ?? '').trim()
  // прибрати початковий «Серія 12.» / «Серія 12 —» / «Сезон 1 Серія 2.»
  t = t.replace(/^\s*(сезон\s*\d+[\s.,·-]*)?(серія|епізод)\s*\d+\s*[.:—–-]*\s*/i, '').trim()
  // зняти зовнішні лапки «...» " ... " '...'
  t = t.replace(/^[«"„'']\s*/, '').replace(/\s*[»"'']\s*$/, '').trim()
  return t || raw
}

export default function TyshaSection() {
  const { colors } = useTheme()
  const [items, setItems] = useState<TyshaItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/tysha')
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true))
  }, [])

  // Поки нема опублікованих серій — рубрику не показуємо взагалі.
  if (!loaded || items.length === 0) return null

  return (
    <section style={{ background: colors.bg, padding: '16px 20px 28px' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <div className="ts-kicker">Авторські серіали · 18+</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: colors.fg, fontFamily: FONT, lineHeight: 1.15 }}>ТИША</div>
          <div style={{ fontSize: 13, fontStyle: 'italic', color: AMBER, fontFamily: FONT, margin: '3px 0 2px' }}>Історія, яку чуєш серцем</div>
          <div style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.55)', fontFamily: FONT }}>Проза про війну · психологічний реалізм</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 14, alignItems: 'stretch' }}>
          {items.map((ep) => (
            <a
              key={ep.id}
              href={`https://balabony.com${ep.url}`}
              onClick={() => trackStoryEvent(ep.id, ep.title, 'open')}
              className="ts-card"
            >
              <div style={{ padding: 8, flexShrink: 0 }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 2', overflow: 'hidden', background: 'linear-gradient(135deg,#1a2a4a,#0f1e3a)', borderRadius: 8 }}>
                  {ep.cover_url ? (
                    <img
                      src={ep.cover_url}
                      alt={ep.title}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      className="ts-cover-img"
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 11, color: 'rgba(245,240,232,0.3)', fontFamily: FONT }}>
                      обкладинка серії
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#e0484d', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6, letterSpacing: 0.5, fontFamily: FONT, lineHeight: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>18+</div>
                </div>
              </div>

              <div style={{ padding: '11px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, fontFamily: FONT, letterSpacing: 0.3 }}>Назар Колодій</div>
                {ep.number != null && (
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: AMBER, fontFamily: FONT, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                    {ep.season != null ? `Сезон ${ep.season} · ` : ''}Серія {ep.number}
                  </div>
                )}
                <div className="ts-title-text" style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', fontFamily: FONT, lineHeight: 1.4, textTransform: 'uppercase' }}>
                  {cleanTitle(ep.title)}
                </div>
                {ep.description && <p className="ts-teaser">{ep.description}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: GOLD, fontFamily: FONT, border: `1px solid ${GOLD}`, padding: '2px 8px', borderRadius: 20 }}>Драма</span>
                  {ep.duration_minutes && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: GOLD, fontFamily: FONT, border: `1px solid ${GOLD}`, padding: '2px 8px', borderRadius: 20 }}>{ep.duration_minutes} хв</span>
                  )}
                  {ep.has_audio && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: GOLD, fontFamily: FONT, border: `1px solid ${GOLD}`, padding: '2px 8px', borderRadius: 20 }}>аудіо</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
