'use client'

import { useRef, useState } from 'react'
import { UA_PATH, CRIMEA_PATH, VIEW_W, VIEW_H, project } from './ukraine-map'
import { CITIES, TOT_NOTE, type City } from './data'

// Мапа України з Кримом. Шов між материком і Кримом закриваємо обводкою кольору заливки — щоб не виглядав як кордон.
// 11.11.2026: інтерактивність — наведення/дотик до крапки показує назву міста, клік обирає місто (onPick),
// клік по мапі повертає координати (onMapClick) — для гри «Знайди на мапі».
const LAND = '#1E3A5C'
const EDGE = '#FAC775'
const KX = project(0, 23)[0] // = cos(48.4°)·60 — масштаб по довготі


// Географічний шар: головні річки, моря, Карпати, Говерла, столиця. Координати — опорні точки русел (спрощено).
const RIVERS: { n: string; pts: [number, number][]; lab: [number, number] }[] = [
  { n: 'Дніпро', pts: [[51.5, 30.6], [50.45, 30.55], [49.75, 31.46], [49.44, 32.06], [49.07, 33.42], [48.46, 35.04], [47.84, 35.14], [47.57, 34.4], [46.75, 33.37], [46.64, 32.61], [46.52, 32.1]], lab: [49.2, 32.7] },
  { n: 'Дністер', pts: [[49.25, 22.95], [49.12, 24.72], [48.51, 26.49], [48.45, 27.8], [48.13, 28.28], [47.26, 29.16], [46.6, 29.9], [46.3, 30.2]], lab: [48.75, 25.6] },
  { n: 'Південний Буг', pts: [[49.6, 26.6], [49.42, 27.0], [49.23, 28.47], [48.33, 29.87], [48.04, 30.85], [47.57, 31.33], [46.97, 31.99], [46.62, 31.9]], lab: [48.6, 29.0] },
  { n: 'Десна', pts: [[52.0, 33.26], [51.49, 31.29], [50.75, 30.75], [50.55, 30.55]], lab: [51.7, 32.2] },
  { n: 'Дунай', pts: [[45.5, 28.2], [45.45, 28.28], [45.35, 28.84], [45.45, 29.27], [45.4, 29.6], [45.35, 29.75]], lab: [45.05, 28.5] },
]
function GeoLayer() {
  const P = (lat: number, lon: number) => project(lat, lon)
  const line = (pts: [number, number][]) => pts.map(([a, b], k) => { const [x, y] = P(a, b); return `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}` }).join('')
  const txt = (lat: number, lon: number, s: string, size: number, fill: string, italic = false) => { const [x, y] = P(lat, lon); return <text x={x} y={y} fontSize={size} fill={fill} fontStyle={italic ? 'italic' : 'normal'} fontWeight={600} textAnchor="middle" opacity={0.9}>{s}</text> }
  const [hx, hy] = P(48.16, 24.5)
  const [kx, ky] = P(50.45, 30.52)
  return (
    <g pointerEvents="none">
      {RIVERS.map((r) => <path key={r.n} d={line(r.pts)} fill="none" stroke="#5AA9FF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />)}
      {RIVERS.map((r) => <g key={r.n + 't'}>{txt(r.lab[0], r.lab[1], r.n, 13, '#8CC4FF', true)}</g>)}
      {txt(44.55, 31.2, 'Чорне море', 20, '#6FA8E8', true)}
      {txt(46.2, 37.0, 'Азовське море', 15, '#6FA8E8', true)}
      {txt(48.75, 23.35, 'Карпати', 14, '#B7D7A8', true)}
      <path d={`M${hx} ${hy - 9} L${hx + 8} ${hy + 5} L${hx - 8} ${hy + 5} Z`} fill="#B7D7A8" />
      {txt(47.92, 24.5, 'Говерла 2061 м', 12, '#B7D7A8')}
      <path d={`M${kx} ${ky - 13} L${kx + 3.5} ${ky - 4} L${kx + 13} ${ky - 4} L${kx + 5.5} ${ky + 2} L${kx + 8.5} ${ky + 11} L${kx} ${ky + 5.5} L${kx - 8.5} ${ky + 11} L${kx - 5.5} ${ky + 2} L${kx - 13} ${ky - 4} L${kx - 3.5} ${ky - 4} Z`} fill="#FFD700" stroke="#0057B7" strokeWidth={1.5} />
    </g>
  )
}

export function unproject(x: number, y: number) {
  return { lat: 52.5 - y / 60, lon: 22 + x / KX }
}

export default function UaMap({ marks = [], thread, label, showAll = true, onPick, onMapClick, active, geo = false }: {
  marks?: { city: City; color: string; label?: string }[]
  thread?: [City, City]
  label?: string
  showAll?: boolean
  onPick?: (c: City) => void
  onMapClick?: (lat: number, lon: number) => void
  active?: string
  geo?: boolean
}) {
  const [hover, setHover] = useState<City | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  let threadPath = ''
  if (thread) {
    const [x1, y1] = project(thread[0].lat, thread[0].lon)
    const [x2, y2] = project(thread[1].lat, thread[1].lon)
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
    const dx = x2 - x1, dy = y2 - y1
    const len = Math.hypot(dx, dy) || 1
    const bend = Math.min(80, len * 0.25)
    const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend
    threadPath = `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  function click(e: React.MouseEvent<SVGSVGElement>) {
    if (!onMapClick || !svg.current) return
    const pt = svg.current.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const m = svg.current.getScreenCTM()
    if (!m) return
    const p = pt.matrixTransform(m.inverse())
    const g = unproject(p.x, p.y)
    onMapClick(g.lat, g.lon)
  }
  const tip = hover
  return (
    <svg ref={svg} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={label ?? 'Мапа України'} onClick={click}
      style={{ width: '100%', height: 'auto', display: 'block', cursor: onMapClick ? 'crosshair' : 'default', touchAction: 'manipulation' }}>
      <g>
        <path d={UA_PATH + CRIMEA_PATH} fill="none" stroke={EDGE} strokeWidth={2.4} strokeLinejoin="round" />
        <path d={UA_PATH + CRIMEA_PATH} fill={LAND} stroke={LAND} strokeWidth={1.6} strokeLinejoin="round" />
      </g>
      {geo && <GeoLayer />}
      {showAll && CITIES.map((c) => {
        const [x, y] = project(c.lat, c.lon)
        const on = hover?.n === c.n || active === c.n
        return (
          <g key={c.n}
            onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover((h) => (h?.n === c.n ? null : h))}
            onClick={onPick ? (e) => { e.stopPropagation(); setHover(c); onPick(c) } : undefined}
            onFocus={() => setHover(c)} onBlur={() => setHover(null)}
            onKeyDown={onPick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(c) } } : undefined}
            tabIndex={onPick ? 0 : -1} role={onPick ? 'button' : undefined} aria-label={onPick ? `${c.n}${c.tot ? '. ' + TOT_NOTE : ''}` : undefined}
            style={{ cursor: onPick ? 'pointer' : 'default', outline: 'none' }}>
            <circle cx={x} cy={y} r={12} fill="transparent" />
            <circle cx={x} cy={y} r={on ? 7 : c.obl ? 3.4 : 2.4} fill={on ? '#FFD700' : c.tot ? '#9FB4CC' : '#CFE3FA'} opacity={on ? 1 : 0.8}
              stroke={on ? '#0057B7' : 'none'} strokeWidth={on ? 2.5 : 0} style={{ transition: 'r .15s' }} />
          </g>
        )
      })}
      {threadPath && (
        <path d={threadPath} fill="none" stroke="#FFD78A" strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round" pointerEvents="none">
          <animate attributeName="stroke-dashoffset" from="130" to="0" dur="1.6s" fill="freeze" />
        </path>
      )}
      {marks.map(({ city, color, label: l }) => {
        const [x, y] = project(city.lat, city.lon)
        const right = x < VIEW_W - 170
        return (
          <g key={city.n + color} pointerEvents="none">
            <circle cx={x} cy={y} r={11} fill={color} opacity={0.25} />
            <circle cx={x} cy={y} r={6.5} fill={color} stroke="#0E1A2B" strokeWidth={2} />
            {(l ?? city.n) && <text x={right ? x + 12 : x - 12} y={y - 10} textAnchor={right ? 'start' : 'end'} fontSize={19} fontWeight={700} fill="#FFFFFF" stroke="#0E1A2B" strokeWidth={4} paintOrder="stroke">{l ?? city.n}</text>}
          </g>
        )
      })}
      {tip && showAll && (() => {
        const [x, y] = project(tip.lat, tip.lon)
        const w = Math.max(70, tip.n.length * 11 + 24) + (tip.tot ? 120 : 0)
        const left = Math.min(Math.max(x - w / 2, 4), VIEW_W - w - 4)
        const top = y > 60 ? y - 46 : y + 14
        return (
          <g pointerEvents="none">
            <rect x={left} y={top} width={w} height={32} rx={9} fill="#0E1A2B" stroke="#FFD700" strokeWidth={1.5} />
            <text x={left + w / 2} y={top + 21} textAnchor="middle" fontSize={17} fontWeight={800} fill="#fff">
              {tip.n}{tip.tot ? <tspan fill="#FAC775" fontWeight={600}> · памʼятаємо</tspan> : null}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
