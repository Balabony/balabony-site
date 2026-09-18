// FILE: app/pysmennytskyi-horoskop/ZodiacBadge.tsx
// Фірмові значки знаків: стилізоване сузір'я золотом на навій, як обкладинка
// BrandCover. Навмисно SVG, а не символи ♈…♓: на телефонах ті символи
// малюються кольоровими емодзі й ламають стиль. Сузір'я спрощені, не
// астрономічна карта. aria-hidden, бо назва знака стоїть у заголовку поруч.

type P = [number, number]
type Shape = { stars: P[]; lines: [number, number][]; bright?: number[] }

const SHAPES: Record<string, Shape> = {
  oven: { stars: [[18, 62], [42, 48], [62, 44], [80, 52]], lines: [[0, 1], [1, 2], [2, 3]], bright: [2] },
  telets: { stars: [[16, 20], [34, 38], [50, 54], [64, 40], [84, 20], [48, 74]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]], bright: [2] },
  bliznyuky: { stars: [[32, 18], [34, 46], [28, 78], [64, 16], [64, 46], [70, 80]], lines: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4]], bright: [0, 3] },
  rak: { stars: [[50, 18], [50, 48], [28, 76], [74, 74]], lines: [[0, 1], [1, 2], [1, 3]], bright: [1] },
  lev: { stars: [[30, 34], [34, 20], [46, 18], [50, 30], [42, 44], [44, 60], [68, 52], [84, 64], [62, 72]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 5]], bright: [5] },
  diva: { stars: [[16, 30], [34, 40], [50, 46], [64, 60], [80, 76], [56, 24], [72, 18], [44, 78]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [3, 7]], bright: [3] },
  terezy: { stars: [[50, 18], [26, 46], [74, 46], [22, 74], [80, 70]], lines: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4]], bright: [0] },
  skorpion: { stars: [[18, 22], [26, 34], [18, 46], [40, 44], [50, 56], [58, 70], [72, 78], [82, 68], [80, 56]], lines: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]], bright: [3] },
  strilets: { stars: [[28, 42], [46, 34], [62, 42], [56, 62], [36, 64], [80, 28], [48, 18], [20, 76]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [2, 5], [1, 6], [4, 7]], bright: [2] },
  kozorih: { stars: [[16, 28], [44, 40], [82, 26], [72, 56], [44, 74]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], bright: [2] },
  vodoliy: { stars: [[14, 32], [30, 24], [46, 34], [58, 26], [74, 38], [60, 56], [48, 70], [66, 82]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 7]], bright: [3] },
  ryby: { stars: [[16, 18], [26, 14], [28, 26], [30, 42], [44, 60], [56, 78], [70, 58], [84, 42], [90, 50]], lines: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]], bright: [5] },
}

// Тло: кілька тьмяних зірок у сталих місцях, однакові для всіх знаків.
const DUST: P[] = [[24, 30], [70, 18], [82, 40], [20, 62], [36, 84], [64, 86], [86, 72], [50, 12]]

export default function ZodiacBadge({ sign, size = 64 }: { sign: string; size?: number }) {
  const s = SHAPES[sign]
  if (!s) return null
  // Сузір'я малюється в квадраті 0–100 і стискається в коло з полями.
  const t = (v: number) => 15 + v * 0.7
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={{ flexShrink: 0, display: "block" }}>
      <circle cx="50" cy="50" r="48" fill="#0E1A2B" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#EF9F27" strokeWidth="1.5" opacity="0.85" />
      {DUST.map(([x, y], i) => <circle key={`d${i}`} cx={x} cy={y} r="0.9" fill="#FFF8EE" opacity="0.35" />)}
      {s.lines.map(([a, b], i) => (
        <line key={i} x1={t(s.stars[a][0])} y1={t(s.stars[a][1])} x2={t(s.stars[b][0])} y2={t(s.stars[b][1])}
          stroke="#EF9F27" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
      ))}
      {s.stars.map(([x, y], i) => {
        const big = s.bright?.includes(i)
        return <circle key={i} cx={t(x)} cy={t(y)} r={big ? 3.4 : 2.3} fill={big ? "#FFF8EE" : "#EF9F27"} />
      })}
    </svg>
  )
}
