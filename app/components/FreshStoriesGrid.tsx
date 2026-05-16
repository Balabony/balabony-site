'use client'

import { useTheme } from '../context/ThemeContext'
import ShareButtons from './ShareButtons'
import { trackStoryEvent } from '@/lib/analytics'

const GOLD = '#F5A623'
const CARD_BG = '#0f1e3a'
const FONT = "'Montserrat', Arial, sans-serif"

export interface Story {
  id: string
  title: string
  author: string
  coverUrl: string
  coverPosition?: string  // лишаємо для зворотної сумісності зі старими записами
  tags: string[]
  hasAudio: boolean
  teaser: string
  url: string
  genre?: string
  duration_minutes?: number
  category?: string
}

function DropShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 3.5 6.5 3.5 13C3.5 17.7 7.3 21.3 12 22C16.7 21.3 20.5 17.7 20.5 13C20.5 6.5 12 2 12 2Z"
        stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M8.5 13l2.5 2.5 4.5-5" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/**
 * Для нового підходу (server-side crop) фото вже прийшло обрізаним — просто показуємо його cover.
 * Для старих записів з cover_position типу "scale:X x:Y y:Z" або "70% 30%" — підтримуємо fallback.
 */
function getCoverStyle(coverPosition: string | undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    width: '100%',
    height: 175,
    objectFit: 'cover',
    display: 'block',
  }

  if (!coverPosition || coverPosition === 'center') return { ...base, objectPosition: 'center' }

  // Старі формати - fallback (не для нових записів)
  const transformM = coverPosition.match(/scale:(-?\d+)\s+x:(-?\d+)\s+y:(-?\d+)/)
  if (transformM) {
    const scale = Math.max(100, Math.min(400, parseInt(transformM[1], 10)))
    const tx    = Math.max(-200, Math.min(200, parseInt(transformM[2], 10)))
    const ty    = Math.max(-200, Math.min(200, parseInt(transformM[3], 10)))
    return {
      ...base,
      transform: `translate(${tx}%, ${ty}%) scale(${scale / 100})`,
      transformOrigin: 'center center',
    }
  }

  // Дуже старий object-position
  if (/^\s*[\d.]+%/.test(coverPosition) || /^(left|right|center|top|bottom)/.test(coverPosition)) {
    return { ...base, objectPosition: coverPosition }
  }

  return { ...base, objectPosition: 'center' }
}

export default function FreshStoriesGrid({ stories }: { stories: Story[] }) {
  const { colors } = useTheme()

  return (
    <section style={{ background: colors.bg, padding: '20px 20px 40px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 26 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: `${GOLD}1A`, border: `1px solid ${GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DropShieldIcon />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: FONT, lineHeight: 1 }}>Нові надходження</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: colors.fg, fontFamily: FONT, lineHeight: 1.2 }}>Свіжі історії</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))', gap: 20 }}>
          {stories.map(story => (
            <div key={story.id} style={{ border: `1.5px solid ${GOLD}`, borderRadius: 16, overflow: 'hidden', background: CARD_BG, display: 'flex', flexDirection: 'column' }}>

              <div style={{ position: 'relative', flexShrink: 0, width: '100%', height: 175, overflow: 'hidden', background: '#000' }}>
                <img
                  src={story.coverUrl}
                  alt={story.title}
                  onError={e => { (e.target as HTMLImageElement).src = '/og-image.jpg' }}
                  style={getCoverStyle(story.coverPosition)}
                />
              </div>

              <div style={{ padding: '13px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT, letterSpacing: 0.3 }}>
                  {story.author}
                </div>
                <a
                  href={`https://balabony.com${story.url}`}
                  onClick={() => trackStoryEvent(story.id, story.title, 'open')}
                  style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', fontFamily: FONT, lineHeight: 1.4, textDecoration: 'none', textTransform: 'uppercase', paddingLeft: 14 }}
                >
                  {story.title}
                </a>
                <p style={{ fontSize: 12, color: '#7A90A8', fontFamily: FONT, lineHeight: 1.65, margin: 0, flexGrow: 1 }}>
                  {story.teaser}
                </p>
                {(() => {
                  const displayTags = [
                    story.genre,
                    story.duration_minutes ? `${story.duration_minutes} хв` : null,
                    story.category,
                  ].filter(Boolean) as string[]
                  if (!displayTags.length) return null
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {displayTags.map(tag => (
                        <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: GOLD, fontFamily: FONT, border: `1px solid ${GOLD}`, padding: '2px 8px', borderRadius: 20 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )
                })()}
                <ShareButtons url={`https://balabony.com${story.url}`} title={story.title} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
