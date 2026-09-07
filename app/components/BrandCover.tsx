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
 * посередині, навійна смуга з підписом «БАЛАБОНИ» внизу. Обводка потрібна не
 * для краси: без неї кольорове поле зливається з тлом картки в каталозі.
 * Підпис білим на навії, а не кольором на кольорі — на золоті він інакше
 * майже не читався. Ні автора, ні жанру на самій обкладинці немає — вони
 * стоять поруч, на картці каталогу, і дублювати їх ні до чого.
 *
 * Колір тексту рахується від яскравості тла, а не задається вручну: на
 * золотому потрібен навій, на фіолетовому — білий. Без цього назва зникає
 * на темних жанрових відтінках.
 */

const NAVY = '#0E1A2B'
const CREAM = '#FFF8EE'
const WHITE = '#FFFFFF'

/**
 * Тло завжди золоте.
 *
 * Спершу колір задавався жанром — військова проза оливкова, містика
 * фіолетова. У каталозі це виглядало строкато: поруч стояли зелені, жовті й
 * бузкові прямокутники, і замість серії одного видавництва виходив набір
 * випадкових плиток. Одне золото читається як марка.
 */
const BG = '#EF9F27'

/**
 * Два формати. Картки в каталозі мають широке гніздо (приблизно 3:2), а
 * сторінка твору — високе. Одна вертикальна обкладинка на 400x600, вписана
 * в широке гніздо, лишала чорні поля з боків і стискала назву до
 * нечитабельного розміру. Тому пропорція задається знадвору.
 */
const SHAPE = {
  wide: { W: 600, H: 400, BAND: 62, FOOT: 34, PAD: 8, LOGO: 44 },
  tall: { W: 400, H: 600, BAND: 120, FOOT: 56, PAD: 12, LOGO: 76 },
} as const

export type CoverShape = keyof typeof SHAPE

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

function fontSize(title: string, shape: CoverShape): number {
  const n = title.trim().length
  if (shape === 'wide') {
    if (n <= 20) return 62
    if (n <= 34) return 54
    if (n <= 50) return 46
    return 38
  }
  if (n <= 22) return 36
  if (n <= 40) return 32
  if (n <= 60) return 28
  return 24
}

export default function BrandCover({
  title,
  shape = 'wide',
  className,
}: {
  title: string
  shape?: CoverShape
  className?: string
}) {
  const { W, H, BAND, FOOT, PAD, LOGO } = SHAPE[shape]
  const ink = NAVY
  const fieldTop = PAD + BAND + 5
  const fieldBottom = H - PAD - FOOT
  const size = fontSize(title, shape)
  const lines = wrap(title, size, W - 120)
  const lh = Math.round(size * 1.16)
  const top = (fieldTop + fieldBottom) / 2 - ((lines.length - 1) * lh) / 2 + lh / 4

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Обкладинка: ${title}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <rect width={W} height={H} fill={WHITE} />
      <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} fill={BG} />
      <rect x={PAD} y={PAD} width={W - PAD * 2} height={BAND} fill={NAVY} />
      <rect x={PAD} y={PAD + BAND} width={W - PAD * 2} height="5" fill={CREAM} />
      <rect x={PAD} y={fieldBottom} width={W - PAD * 2} height={FOOT} fill={NAVY} />

      <circle
        cx={W / 2}
        cy={PAD + BAND / 2}
        r={LOGO / 2}
        fill="none"
        stroke={BG}
        strokeWidth={LOGO / 13}
      />
      <text
        x={W / 2}
        y={PAD + BAND / 2 + LOGO * 0.3}
        textAnchor="middle"
        fontFamily="Montserrat, Arial, sans-serif"
        fontSize={LOGO * 0.68}
        fontWeight="700"
        fill={BG}
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
        y={fieldBottom + FOOT / 2 + 5}
        textAnchor="middle"
        fontFamily="Montserrat, Arial, sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="4"
        fill={WHITE}
      >
        БАЛАБОНИ
      </text>
    </svg>
  )
}
