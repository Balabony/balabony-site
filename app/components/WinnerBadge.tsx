// Фірмовий знак переможця конкурсу Balabony — «Золоте перо».
// Рішення Богдана 18.09.2026: замість зірки перо, бо нагороджуємо саме за
// письмо. Навій печатки й золото — ті самі, що в BrandCover.
// Римська цифра стоїть ПІД пером, а не на ньому: у малому значку біля імені
// автора (34 px) цифра на самому пері не читалася б.
// Для ІІ і ІІІ місця перо тьмяніше, щоб перше вирізнялося з першого погляду.

import type { Place } from '@/lib/contest-winners'

const ROMAN: Record<Place, string> = { 1: 'I', 2: 'II', 3: 'III' }
const NIB: Record<Place, string> = { 1: '#EF9F27', 2: '#D9B36A', 3: '#B98A4E' }

export default function WinnerBadge({ place, size = 56, title }: { place: Place; size?: number; title?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      style={{ flexShrink: 0, display: 'block' }}
    >
      <circle cx="50" cy="50" r="48" fill="#0E1A2B" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#EF9F27" strokeWidth="2" />
      {/* Перо вістрям униз */}
      <path d="M50 68 L37 42 C37 30 42 21 50 12 C58 21 63 30 63 42 Z" fill={NIB[place]} />
      <line x1="50" y1="68" x2="50" y2="38" stroke="#0E1A2B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="36" r="3.6" fill="#0E1A2B" />
      <path d="M40 30 Q50 26 60 30" fill="none" stroke="#0E1A2B" strokeWidth="1.4" opacity="0.55" />
      <text
        x="50" y="88" textAnchor="middle"
        fontFamily="Georgia, 'Lora', serif" fontWeight="700" fontSize={place === 3 ? 15 : 17}
        fill="#FFF8EE"
      >
        {ROMAN[place]}
      </text>
    </svg>
  )
}
