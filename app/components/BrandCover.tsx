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
 * 19.10.2026: білу зовнішню рамку прибрано — у картках, ширших за 3:2, вона
 * лишалася лише з боків (див. коментар у розмітці).
 */

const NAVY = '#0E1A2B'
const NAVY_LIFT = '#16294a'
const GOLD = '#EF9F27'
const CREAM = '#FFF8EE'

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
  const { W, H, PAD, INSET, TOP, BOTTOM } = SHAPE[shape]
  const size = fontSize(title, shape)
  const lines = wrap(title, size, W - INSET * 2 - 80)
  const lh = Math.round(size * 1.18)
  const top = (TOP + BOTTOM) / 2 - ((lines.length - 1) * lh) / 2 + lh / 4

  // Градієнт ледь помітний і потрібен лише для того, щоб велике темне поле
  // не виглядало як залитий прямокутник. Ідентифікатор унікальний на розмір:
  // на сторінці буває десяток обкладинок, і однакові id збивають заливку.
  const gid = `bc-${shape}`

  // 19.10.2026: поле малює обгортка (той самий градієнт), а SVG вписується цілком («meet»).
  // Раніше «slice» у картках, ширших за 3:2, обрізав монограму й підпис, а біла рамка лишалася лише з боків.
  return (
    <div className={className} style={{ width: '100%', height: '100%', background: `linear-gradient(${NAVY_LIFT}, ${NAVY})` }}>
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Обкладинка: ${title}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NAVY_LIFT} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
      </defs>

      {/* 19.10.2026: білу зовнішню рамку прибрано. Картка каталогу ширша за 3:2, тому «slice» обрізав
          білу смугу згори й знизу, а з боків лишав — на телефоні це виглядало як помилка верстки.
          Межу обкладинки тепер тримає золота рамка картки. Поле — на всю площу. */}
      <rect width={W} height={H} fill={`url(#${gid})`} />

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

      {/* 19.10.2026 (Богдан): монограму «B» угорі прибрано. */}

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

      {/* 19.10.2026 (Богдан): підпис «БАЛАБОНИ» внизу і риску над ним прибрано. */}
    </svg>
    </div>
  )
}
