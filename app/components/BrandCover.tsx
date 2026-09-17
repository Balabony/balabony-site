'use client'

/**
 * Брендова обкладинка Балабонів — SVG, не картинка.
 *
 * Малюється в браузері з назви твору. Нічого не зберігається у сховищі,
 * зміна дизайну оновлює всі обкладинки одразу, а текст лишається текстом —
 * чіткий на будь-якому екрані.
 *
 * Ставиться ЛИШЕ там, де в твору немає власної обкладинки. Наявні картинки
 * не заміщуємо: фотографія на картці виразніша за типографіку.
 *
 * ПЕРЕРОБЛЕНО 17.09.2026. Було: суцільне золоте поле й дві широкі навійні
 * смуги — угорі з логотипом, унизу з підписом. У сітці каталогу поруч із
 * фотографіями ця пляма кричала голосніше за них, і сторінка жанру читалася
 * як набір попереджувальних знаків, а не як полиця з книжками.
 *
 * Стало: навійне поле в тон сайту, золото лишилося деталями — тонка
 * внутрішня рамка, монограма, риска й підпис. Композиція та сама
 * (монограма — назва — підпис), змінилася вага кольорів.
 *
 * Біла зовнішня рамка лишається й тут, і не для краси: без неї темне поле
 * зливається з темною карткою каталогу, і обкладинка втрачає межі.
 */

const NAVY = '#0E1A2B'
const NAVY_LIFT = '#16294a'
const GOLD = '#EF9F27'
const CREAM = '#FFF8EE'
const WHITE = '#FFFFFF'

/**
 * Два формати. Картки в каталозі мають широке гніздо (приблизно 3:2), а
 * сторінка твору — високе. Одна вертикальна обкладинка, вписана в широке
 * гніздо, лишала чорні поля з боків і стискала назву до нечитабельного
 * розміру, тому пропорція задається знадвору.
 *
 * INSET — відступ золотої рамки від краю поля. MONO — радіус монограми.
 * TOP/BOTTOM — межі, між якими центрується назва.
 */
const SHAPE = {
  wide: { W: 600, H: 400, PAD: 8, INSET: 22, MONO: 21, TOP: 104, BOTTOM: 318, FOOT: 46, RULE: 54 },
  tall: { W: 400, H: 600, PAD: 10, INSET: 24, MONO: 26, TOP: 150, BOTTOM: 484, FOOT: 62, RULE: 62 },
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
    if (n <= 20) return 56
    if (n <= 34) return 48
    if (n <= 50) return 41
    return 34
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
  const { W, H, PAD, INSET, MONO, TOP, BOTTOM, FOOT, RULE } = SHAPE[shape]
  const size = fontSize(title, shape)
  const lines = wrap(title, size, W - INSET * 2 - 80)
  const lh = Math.round(size * 1.18)
  const top = (TOP + BOTTOM) / 2 - ((lines.length - 1) * lh) / 2 + lh / 4

  // Градієнт ледь помітний і потрібен лише для того, щоб велике темне поле
  // не виглядало як залитий прямокутник. Ідентифікатор унікальний на розмір:
  // на сторінці буває десяток обкладинок, і однакові id збивають заливку.
  const gid = `bc-${shape}`

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
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_LIFT} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={WHITE} />
      <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} fill={`url(#${gid})`} />

      {/* Внутрішня золота рамка — те, що робить прямокутник обкладинкою. */}
      <rect
        x={PAD + INSET}
        y={PAD + INSET}
        width={W - (PAD + INSET) * 2}
        height={H - (PAD + INSET) * 2}
        fill="none"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />

      {/* Монограма. Коло розриває рамку зверху, тому під ним заливка кольором
          поля: без неї лінія перекреслює літеру. */}
      <circle cx={W / 2} cy={PAD + INSET} r={MONO + 7} fill={NAVY_LIFT} />
      <circle cx={W / 2} cy={PAD + INSET} r={MONO} fill="none" stroke={GOLD} strokeWidth={MONO / 11} />
      <text
        x={W / 2}
        y={PAD + INSET + MONO * 0.34}
        textAnchor="middle"
        fontFamily="Montserrat, Arial, sans-serif"
        fontSize={MONO * 0.95}
        fontWeight="700"
        fill={GOLD}
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
          fill={CREAM}
        >
          {ln}
        </text>
      ))}

      {/* Риска відділяє підпис від назви — інакше вони читаються одним блоком. */}
      <rect x={(W - RULE) / 2} y={H - PAD - FOOT} width={RULE} height="1.5" fill={GOLD} fillOpacity="0.7" />
      <text
        x={W / 2}
        y={H - PAD - FOOT + (shape === 'wide' ? 26 : 32)}
        textAnchor="middle"
        fontFamily="Montserrat, Arial, sans-serif"
        fontSize={shape === 'wide' ? 12 : 13}
        fontWeight="700"
        letterSpacing="4.5"
        fill={GOLD}
      >
        БАЛАБОНИ
      </text>
    </svg>
  )
}
