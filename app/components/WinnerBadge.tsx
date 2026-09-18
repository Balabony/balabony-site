// Фірмовий знак переможця конкурсу Balabony: золота п'ятикутна зірка з
// номером місця на навій печатці з подвійним золотим кільцем. Зірка — від
// назви першого конкурсу «Зірковий старт», кольори — ті самі, що в BrandCover.
// Для ІІ і ІІІ місця зірка тьмяніша, щоб перше місце вирізнялося з першого погляду.

import type { Place } from '@/lib/contest-winners'

const ROMAN: Record<Place, string> = { 1: 'I', 2: 'II', 3: 'III' }

// П'ятикутна зірка з центром у (50,50).
function starPoints(r1: number, r2: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? r1 : r2
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

export default function WinnerBadge({ place, size = 56, title }: { place: Place; size?: number; title?: string }) {
  const star = place === 1 ? '#EF9F27' : place === 2 ? '#D9B36A' : '#B98A4E'
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <circle cx="50" cy="50" r="48" fill="#0E1A2B" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#EF9F27" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#EF9F27" strokeWidth="0.8" strokeDasharray="1.5 3" opacity="0.8" />
      <polygon points={starPoints(33, 14)} fill={star} />
      <text
        x="50" y="57" textAnchor="middle"
        fontFamily="Georgia, 'Lora', serif" fontWeight="700" fontSize={place === 3 ? 15 : 18}
        fill="#0E1A2B"
      >
        {ROMAN[place]}
      </text>
    </svg>
  )
}
