'use client'

import CoverImage from './CoverImage'

import { useTheme } from '../context/ThemeContext'
import { trackStoryEvent } from '@/lib/analytics'

const GOLD = 'var(--accent-gold)'
const AMBER = '#FFB347'
const CARD_BG = '#0f1e3a'
const FONT = "'Montserrat', Arial, sans-serif"

const STYLES = `
.fs-kicker {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  color: ${GOLD};
  letter-spacing: 2px;
  text-transform: uppercase;
  line-height: 1;
  background: rgba(239,159,39,0.14);
  border: 1px solid rgba(239,159,39,0.5);
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
  animation: fsKickerGlow 2.2s ease-in-out infinite;
}
@keyframes fsKickerGlow {
  0%, 100% { box-shadow: 0 0 6px rgba(239,159,39,0.35); }
  50% { box-shadow: 0 0 18px rgba(239,159,39,0.75); }
}
.fs-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  will-change: transform;
  display: flex;
  flex-direction: column;
  background: ${CARD_BG};
  border: 1.5px solid ${AMBER};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 14px rgba(255,179,71,0.18);
  text-decoration: none;
  color: inherit;
  height: 100%;
  transform: translateY(0);
}
.fs-card:hover,
.fs-card:focus-visible {
  transform: translateY(-6px);
  box-shadow: 0 0 32px rgba(255,179,71,0.5);
  outline: none;
}
.fs-card:hover .fs-cover-img,
.fs-card:focus-visible .fs-cover-img {
  transform: scale(1.05);
}
.fs-card:hover .fs-title-text,
.fs-card:focus-visible .fs-title-text {
  color: ${AMBER};
}
.fs-card:active {
  transform: translateY(-3px);
  box-shadow: 0 0 24px rgba(255,179,71,0.4);
}
.fs-cover-img {
  transition: transform 0.35s ease;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.fs-title-text {
  transition: color 0.2s ease;
}
.fs-teaser {
  font-size: 12px;
  color: var(--on-dark-muted);
  font-family: ${FONT};
  line-height: 1.55;
  margin: 0;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@media (prefers-reduced-motion: reduce) {
  .fs-card, .fs-cover-img, .fs-title-text { transition: none; }
  .fs-card:hover, .fs-card:focus-visible { transform: none; }
  .fs-card:hover .fs-cover-img, .fs-card:focus-visible .fs-cover-img { transform: none; }
  .fs-kicker { animation: none; }
}
`

export interface Story {
  id: string
  title: string
  author: string
  coverUrl: string
  coverPosition?: string
  tags: string[]
  hasAudio: boolean
  teaser: string
  url: string
  genre?: string
  duration_minutes?: number
  category?: string
  isAdult?: boolean
}

/**
 * Кадр за замовчуванням зміщений угору, а не по центру.
 *
 * З 435 опублікованих історій кадр налаштовано вручну рівно в одній — решті
 * дістається дефолт.
 *
 * Головна причина зрізаних облич була не в позиції, а в пропорціях рамки:
 * 159px висоти на ~290px ширини — це смуга майже 2:1, і від портретного фото
 * лишалася вузька стрічка. Рамку піднято до 200px (~1.45:1), тож обрізається
 * помітно менше.
 *
 * 10% ставить кадр майже під верхній край: на портретах голова починається
 * одразу згори, і будь-який більший відступ зрізає маківку. Хто налаштований
 * вручну в /admin/cover-position — не зачеплений.
 */
/**
 * Чи є в твору справжня обкладинка.
 *
 * Сторінки підставляють '/og-image.jpg' замість порожнього cover_url — це
 * загальний банер сайту, на якому написано «караоке · ігри · аудіо». Нічого
 * з цього ще немає, тому показувати його як обкладинку твору не можна:
 * читач бачить обіцянку функцій, яких не існує. Плюс банер широкий (1200×630),
 * а картка вузька — від слова «Balabony» лишалося «alabony».
 */
function hasRealCover(src: string | null | undefined): boolean {
  if (!src) return false
  return !src.includes('og-image')
}

/**
 * Заміна обкладинки для творів без картинки.
 *
 * Назва й автор у картці вже підписані нижче, тому в самому прямокутнику
 * тексту немає — інакше все дублюється двічі поспіль і читається як помилка
 * верстки. Лишається спокійне тло в кольорах бренду.
 */
function CoverPlaceholder() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(150deg, #14253B 0%, #0E1A2B 60%, #16294a 100%)',
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          border: '1.5px solid rgba(239,159,39,0.42)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: 20, height: 2, borderRadius: 2, background: 'rgba(239,159,39,0.62)' }} />
      </div>
    </div>
  )
}

const DEFAULT_POSITION = '50% 10%'

function getCoverStyle(coverPosition: string | undefined): React.CSSProperties {
  if (!coverPosition || coverPosition === 'center') {
    return { objectPosition: DEFAULT_POSITION }
  }

  const transformM = coverPosition.match(/scale:(-?\d+)\s+x:(-?\d+)\s+y:(-?\d+)/)
  if (transformM) {
    const scale = Math.max(100, Math.min(400, parseInt(transformM[1], 10)))
    // Зсувати можна лише на те, наскільки фото більше за рамку: кожні зайві
    // 2% масштабу дають 1% запасу з боку. Інакше з-під фото вилазить чорна
    // смуга — саме це й ловимо тут, щоб криве значення не псувало картку.
    const limit = Math.max(0, (scale - 100) / 2)
    const tx    = Math.max(-limit, Math.min(limit, parseInt(transformM[2], 10)))
    const ty    = Math.max(-limit, Math.min(limit, parseInt(transformM[3], 10)))
    return {
      transform: `translate(${tx}%, ${ty}%) scale(${scale / 100})`,
      transformOrigin: 'center center',
    }
  }

  if (/^\s*[\d.]+%/.test(coverPosition) || /^(left|right|center|top|bottom)/.test(coverPosition)) {
    return { objectPosition: coverPosition }
  }

  return { objectPosition: DEFAULT_POSITION }
}

/**
 * Якщо тизер обрізаний на короткому слові ("У", "до", "на"...) або на одній літері,
 * прибираємо цей "хвіст" перед "...".
 * Webkit-line-clamp обріже візуально; функція тут просто страхує від випадків,
 * коли тизер уже приходить з "..." з бази.
 */
function cleanTeaser(text: string): string {
  if (!text) return ''
  // Прибираємо існуючі "..." на кінці, потім останні слова <=2 символів
  let t = text.trim().replace(/\.{3,}\s*$/, '').replace(/…\s*$/, '').trim()
  // Якщо останнє слово 1-2 літери — відрізаємо його
  const words = t.split(/\s+/)
  while (words.length > 3 && words[words.length - 1].replace(/[.,;:!?—–\-"'«»()]/g, '').length <= 2) {
    words.pop()
  }
  return words.join(' ')
}

export default function FreshStoriesGrid({
  stories,
  showHeading = true,
}: {
  stories: Story[]
  /** На сторінці автора заголовок уже стоїть вище — другий «Свіжі історії»
   *  всередині секції «Тиша» читається як помилка вёрстки. */
  showHeading?: boolean
}) {
  const { colors } = useTheme()

  return (
    <section style={{ background: colors.bg, padding: '20px 20px 40px' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {showHeading && (
          <div style={{ marginBottom: 26 }}>
            <div className="fs-kicker" style={{ color: colors.fg }}>Нові надходження</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: colors.fg, fontFamily: FONT, lineHeight: 1.2 }}>Свіжі історії</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(275px, 100%), 1fr))', gap: 20, alignItems: 'stretch' }}>
          {stories.map(story => (
            <a
              key={story.id}
              href={`https://balabony.com${story.url}`}
              onClick={() => trackStoryEvent(story.id, story.title, 'open')}
              className="fs-card"
            >
              <div style={{ padding: 8, flexShrink: 0 }}>
                <div style={{ position: 'relative', width: '100%', height: 200, overflow: 'hidden', background: '#000', borderRadius: 8 }}>
                  {hasRealCover(story.coverUrl) ? (
                    <CoverImage
                      mode="fill"
                      src={story.coverUrl}
                      alt={story.title}
                      sizes="(max-width: 700px) 100vw, 320px"
                      className="fs-cover-img"
                      style={getCoverStyle(story.coverPosition)}
                    />
                  ) : (
                    <CoverPlaceholder />
                  )}
                  {story.isAdult && (
                    <div style={{ position: 'absolute', top: 8, right: 8, background: '#e0484d', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6, letterSpacing: 0.5, fontFamily: FONT, lineHeight: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>18+</div>
                  )}
                </div>
              </div>

              <div style={{ padding: '13px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT, letterSpacing: 0.3 }}>
                  {story.author}
                </div>
                <div
                  className="fs-title-text"
                  style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', fontFamily: FONT, lineHeight: 1.4, textTransform: 'uppercase', paddingLeft: 14 }}
                >
                  {story.title}
                </div>
                <p className="fs-teaser">
                  {cleanTeaser(story.teaser)}
                </p>
                {(() => {
                  const displayTags = [
                    story.genre,
                    story.duration_minutes ? `${story.duration_minutes} хв` : null,
                  ].filter(Boolean) as string[]
                  if (!displayTags.length) return null
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 'auto' }}>
                      {displayTags.map(tag => (
                        <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: GOLD, fontFamily: FONT, border: `1px solid ${GOLD}`, padding: '2px 8px', borderRadius: 20 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
