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
  return (
    <svg viewBox="0 0 520 300" role="img" aria-label="Ілюстрація: театральна сцена із завісою, промінь світла й звукові хвилі" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="af-curt" x1="0" x2="1"><stop offset="0" stopColor="#7a1a2c" /><stop offset=".5" stopColor="#a8263c" /><stop offset="1" stopColor="#6a1424" /></linearGradient>
        <radialGradient id="af-spot" cx=".5" cy="0" r="1"><stop offset="0" stopColor="#ffd98a" stopOpacity=".75" /><stop offset=".6" stopColor="#ef9f27" stopOpacity=".12" /><stop offset="1" stopColor="#ef9f27" stopOpacity="0" /></radialGradient>
        <linearGradient id="af-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a2d4d" /><stop offset="1" stopColor="#0a1628" /></linearGradient>
      </defs>
      <rect width="520" height="300" rx="22" fill="#0f1e3a" />
      <path d="M40 300V70Q260-20 480 70v230" fill="#0a1628" stroke="#ef9f27" strokeOpacity=".5" strokeWidth="3" />
      <polygon points="260,20 170,250 350,250" fill="url(#af-spot)" />
      <rect x="40" y="230" width="440" height="70" fill="url(#af-floor)" />
      <ellipse cx="260" cy="250" rx="92" ry="12" fill="#ffd98a" opacity=".22" />
      <path d="M40 70Q100 40 150 52C140 120 132 200 150 300H40Z" fill="url(#af-curt)" />
      <path d="M480 70Q420 40 370 52c10 68 18 148 0 248H480Z" fill="url(#af-curt)" />
      <path d="M150 52c-12 80-14 160 0 248" stroke="#3d0b15" strokeOpacity=".5" strokeWidth="3" fill="none" />
      <path d="M370 52c12 80 14 160 0 248" stroke="#3d0b15" strokeOpacity=".5" strokeWidth="3" fill="none" />
      <g fill="none" stroke="#ef9f27" strokeWidth="3.2" strokeLinecap="round">
        <path d="M228 168c-9 10-9 28 0 38" opacity=".9" /><path d="M212 156c-16 18-16 44 0 62" opacity=".6" /><path d="M196 144c-23 26-23 60 0 86" opacity=".35" />
        <path d="M292 168c9 10 9 28 0 38" opacity=".9" /><path d="M308 156c16 18 16 44 0 62" opacity=".6" /><path d="M324 144c23 26 23 60 0 86" opacity=".35" />
      </g>
      <circle cx="260" cy="187" r="15" fill="#ef9f27" /><circle cx="260" cy="187" r="6" fill="#0a1628" />
      <g fill="#f5f0e8" opacity=".85">{[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <circle key={i} cx={70 + i * 47.5} cy={282} r="4" />)}</g>
    </svg>
  )
}
