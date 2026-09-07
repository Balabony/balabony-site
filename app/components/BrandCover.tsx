'use client'

/**
 * Брендова обкладинка Балабонів — SVG, не картинка.
 *
 * Малюється в браузері з назви й жанру. Через це нічого не зберігається у
 * сховищі, зміна дизайну оновлює всі обкладинки одразу, а текст лишається
 * текстом — чіткий на будь-якому екрані.
 *
 * Ставиться ЛИШЕ там, де в твору немає власної обкладинки. Наявні картинки
 * не заміщуємо: фотографія на картці виразніша за типографіку.
 *
 * Композиція: біла обводка по краю, навійна смуга з логотипом угорі, назва
 * на жанровому кольорі, марка видання внизу. Обводка потрібна не для краси:
 * без неї кольорове поле зливається з тлом картки в каталозі. Ні автора, ні жанру на самій обкладинці немає — вони
 * стоять поруч, на картці каталогу, і дублювати їх ні до чого.
 *
 * Колір тексту рахується від яскравості тла, а не задається вручну: на
 * золотому потрібен навій, на фіолетовому — білий. Без цього назва зникає
 * на темних жанрових відтінках.
 */

const NAVY = '#0E1A2B'
const CREAM = '#FFF8EE'
const WHITE = '#FFFFFF'

/** Тло за жанром. Незнайомий жанр і порожній — золото. */
const GENRE_BG: Record<string, string> = {
  'Життєві історії': '#EF9F27',
  'Сімейна історія': '#D9A56A',
  'Драма':           '#C98A4B',
  'Про кохання':     '#D98B7A',
  'Військова проза': '#9AA98C',
  'Містика':         '#8E8CC4',
  'Детектив':        '#8E8CC4',
  'Казка':           '#5FA8A0',
}
const DEFAULT_BG = '#EF9F27'

const W = 400
const H = 600
const BAND_H = 176
const PAD = 14

/** Яскравість за WCAG. Вище 0.55 — тло світле, текст навій. */
function isLight(hex: string): boolean {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16) / 255
  const g = parseInt(n.slice(2, 4), 16) / 255
  const b = parseInt(n.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.55
}

/** Розбиття назви на рядки за середньою шириною знака Lora. */
function wrap(title: string, size: number, maxWidth: number): string[] {
  const max = Math.max(8, Math.floor(maxWidth / (size * 0.5)))
  const words = title.trim().split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w
    if (t.length <= max) cur = t
    else {
      if (cur) lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 5)
}

function fontSize(title: string): number {
  const n = title.trim().length
  if (n <= 22) return 36
  if (n <= 40) return 32
  if (n <= 60) return 28
  return 24
}

export default function BrandCover({
  title,
  genre,
  className,
}: {
  title: string
  genre?: string | null
  className?: string
}) {
  const bg = (genre && GENRE_BG[genre]) || DEFAULT_BG
  const ink = isLight(bg) ? NAVY : WHITE
  const size = fontSize(title)
  const lines = wrap(title, size, W - 90)
  const lh = Math.round(size * 1.25)
  const top = (PAD + BAND_H + H - PAD) / 2 + 24 - ((lines.length - 1) * lh) / 2

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Обкладинка: ${title}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <rect width={W} height={H} fill={WHITE} />
      <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} fill={bg} />
      <rect x={PAD} y={PAD} width={W - PAD * 2} height={BAND_H} fill={NAVY} />
      <rect x={PAD} y={PAD + BAND_H} width={W - PAD * 2} height="6" fill={CREAM} />

      <circle cx={W / 2} cy="104" r="46" fill="none" stroke={DEFAULT_BG} strokeWidth="7" />
      <text
        x={W / 2}
        y="132"
        textAnchor="middle"
        fontFamily="Montserrat, Arial, sans-serif"
        fontSize="62"
        fontWeight="700"
        fill={DEFAULT_BG}
      >
        B
      </text>

      {lines.map((ln, i) => (
        <text
          key={i}
          x={W / 2}
          y={top + i * lh}
          textAnchor="middle"
          fontFamily="Lora, Georgia, serif"
          fontSize={size}
          fill={ink}
        >
          {ln}
        </text>
      ))}

      <text
        x={W / 2}
        y={H - 56}
        textAnchor="middle"
        fontFamily="Montserrat, Arial, sans-serif"
        fontSize="11"
        fontWeight="700"
        letterSpacing="3"
        fill={ink}
        opacity="0.75"
      >
        BALABONY
      </text>
    </svg>
  )
}
