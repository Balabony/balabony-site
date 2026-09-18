// FILE: app/pysmennytskyi-horoskop/ZodiacBadge.tsx
// Фірмові значки знаків: астрологічний знак, намальований золотою лінією на
// навії печатці (кольори BrandCover). Редакція 18.09.2026: сузір'я з крапок
// Богдан забракував як некрасиві, тепер — самі знаки, намальовані вручну.
// Навмисно SVG-лінії, а не символи ♈…♓: на телефонах ті символи
// малюються кольоровими емодзі й ламають стиль.
// aria-hidden, бо назва знака стоїть у заголовку поруч.

const GLYPHS: Record<string, string> = {
  oven: 'M28 44 C26 26 48 22 50 42 M72 44 C74 26 52 22 50 42 M50 42 L50 80',
  telets: 'M24 24 C28 46 72 46 76 24 M50 44 m-17 0 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0',
  bliznyuky: 'M26 24 Q50 34 74 24 M26 76 Q50 66 74 76 M40 30 L40 70 M60 30 L60 70',
  rak: 'M28 42 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M28 34 C46 24 66 28 78 40 M72 58 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M72 66 C54 76 34 72 22 60',
  lev: 'M34 60 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M44 60 C44 30 74 22 74 44 C74 60 60 66 64 76 C66 82 74 82 78 76',
  diva: 'M22 30 L22 72 M22 40 C22 26 36 26 36 40 L36 72 M36 40 C36 26 50 26 50 40 L50 64 C50 80 72 80 74 64 C76 50 60 50 58 64 L56 80',
  terezy: 'M22 74 L78 74 M22 62 L38 62 C30 40 70 40 62 62 L78 62',
  skorpion: 'M22 30 L22 72 M22 40 C22 26 36 26 36 40 L36 72 M36 40 C36 26 50 26 50 40 L50 66 C50 76 60 78 74 70 M66 64 L75 70 L68 78',
  strilets: 'M28 74 L74 28 M54 28 L74 28 L74 48 M38 50 L52 64',
  kozorih: 'M22 30 L32 64 L42 30 C48 20 58 26 58 46 L58 62 C58 76 78 78 78 64 C78 52 62 52 62 64 C62 76 54 82 46 78',
  vodoliy: 'M20 44 L32 34 L44 44 L56 34 L68 44 L80 36 M20 64 L32 54 L44 64 L56 54 L68 64 L80 56',
  ryby: 'M30 22 C46 40 46 60 30 78 M70 22 C54 40 54 60 70 78 M32 50 L68 50',
}

// Кілька тьмяних зірок на тлі, однакові для всіх знаків.
const DUST: [number, number][] = [[20, 32], [80, 24], [86, 60], [16, 66], [30, 86], [70, 88], [50, 10]]

export default function ZodiacBadge({ sign, size = 64 }: { sign: string; size?: number }) {
  const d = GLYPHS[sign]
  if (!d) return null
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{ flexShrink: 0, display: "block" }}>
      <circle cx="50" cy="50" r="48" fill="#0E1A2B" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#EF9F27" strokeWidth="1.5" opacity="0.6" />
      {DUST.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.9" fill="#FFF8EE" opacity="0.4" />)}
      <g transform="translate(50 50) scale(0.78) translate(-50 -50)">
        <path d={d} fill="none" stroke="#EF9F27" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
