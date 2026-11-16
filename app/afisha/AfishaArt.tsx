// 13.11.2026: власні іконки й ілюстрація «Афіші без барʼєрів» (без стокових емодзі).
import type { Access } from '@/lib/afisha'

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function AccessIcon({ a, size = 18 }: { a: Access; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true as const }
  if (a === 'audio') return <svg {...p}><path {...S} d="M3 12c2.5-4 6-6 9-6s6.5 2 9 6c-2.5 4-6 6-9 6" /><path {...S} d="M9.5 12a2.5 2.5 0 0 1 5 0" /><path {...S} d="M4 20c1.2-1 1.2-3 0-4M7 21.5c2.2-2 2.2-5.6 0-7.5" /></svg>
  if (a === 'subs') return <svg {...p}><rect {...S} x="2.5" y="4.5" width="19" height="15" rx="3" /><path {...S} d="M6 14h7M15.5 14H18M6 16.8h3.5M11.5 16.8H18" /></svg>
  if (a === 'sign') return <svg {...p}><path {...S} d="M8 13V5.8a1.4 1.4 0 0 1 2.8 0V11" /><path {...S} d="M10.8 10.5V4.4a1.4 1.4 0 0 1 2.8 0v6.3" /><path {...S} d="M13.6 10.6V5.6a1.4 1.4 0 0 1 2.8 0V13" /><path {...S} d="M16.4 9.4a1.4 1.4 0 0 1 2.8 0V14a7 7 0 0 1-7 7h-.6a6.2 6.2 0 0 1-5-2.6L4 15.2a1.5 1.5 0 0 1 2.3-1.9L8 15" /></svg>
  if (a === 'wheel') return <svg {...p}><circle {...S} cx="10" cy="15" r="5.5" /><circle cx="10" cy="4.2" r="1.7" fill="currentColor" /><path {...S} d="M10 7v6h5.5l2.5 5" /><path {...S} d="M10 10h4.5" /></svg>
  return <svg {...p}><rect {...S} x="5" y="2.5" width="14" height="19" rx="3" /><circle cx="9.5" cy="7.5" r="1.4" fill="currentColor" /><circle cx="14.5" cy="7.5" r="1.4" fill="currentColor" /><circle cx="9.5" cy="12" r="1.4" fill="currentColor" /><circle {...S} cx="14.5" cy="12" r="1.1" /><circle cx="9.5" cy="16.5" r="1.4" fill="currentColor" /><circle {...S} cx="14.5" cy="16.5" r="1.1" /></svg>
}

/** Сцена: арка, завіса, промінь світла й звукові хвилі — образ «культура для всіх». */
export function StageArt() {
  // 16.11.2026 (Богдан): замість театральних штор — білий кіноекран, субтитри й ряди крісел
  const seats = (y: number, n: number, w: number, h: number, c: string) => <g fill={c}>{Array.from({ length: n }, (_, i) => { const x = 260 - (n * w) / 2 + i * w + 3; return <path key={i} d={`M${x} ${y + h}v-${h - 8}q0-8 8-8h${w - 22}q8 0 8 8v${h - 8}z`} /> })}</g>
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label="Ілюстрація: кінозал із білим екраном, на якому видно субтитри, і ряди крісел" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <radialGradient id="af-glow" cx=".5" cy=".45" r=".7"><stop offset="0" stopColor="#fffaf0" stopOpacity=".55" /><stop offset="1" stopColor="#fffaf0" stopOpacity="0" /></radialGradient>
        <linearGradient id="af-screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#efe8da" /></linearGradient>
        <clipPath id="af-clip"><rect width="520" height="300" rx="22" /></clipPath>
        <filter id="af-blur"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <rect width="520" height="300" rx="22" fill="#0a1628" />
      <ellipse cx="260" cy="110" rx="250" ry="120" fill="url(#af-glow)" filter="url(#af-blur)" />
      <path d="M58 40Q260 26 462 40V182Q260 170 58 182Z" fill="url(#af-screen)" />
      <path d="M58 40Q260 26 462 40" stroke="#ef9f27" strokeOpacity=".7" strokeWidth="2" fill="none" />
      <rect x="170" y="140" width="180" height="9" rx="4.5" fill="#0a1628" opacity=".78" />
      <rect x="205" y="155" width="110" height="9" rx="4.5" fill="#0a1628" opacity=".78" />
      <g fill="none" stroke="#ef9f27" strokeWidth="3" strokeLinecap="round">
        <path d="M244 82c-6 7-6 19 0 26" /><path d="M233 74c-11 12-11 30 0 42" opacity=".55" />
        <path d="M276 82c6 7 6 19 0 26" /><path d="M287 74c11 12 11 30 0 42" opacity=".55" />
      </g>
      <circle cx="260" cy="95" r="9" fill="#ef9f27" />
      <g clipPath="url(#af-clip)">
        {seats(206, 9, 44, 26, '#17294a')}
        {seats(232, 10, 46, 30, '#13223f')}
        {seats(262, 11, 48, 38, '#0f1c34')}
      </g>
    </svg>
  )
}
