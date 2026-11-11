'use client'

import { UA_PATH, CRIMEA_PATH, VIEW_W, VIEW_H, project } from './ukraine-map'
import { CITIES, type City } from './data'

// Мапа України з Кримом. Шов між материком і Кримом закриваємо обводкою кольору заливки — щоб не виглядав як кордон.
const LAND = '#1E3A5C'
const EDGE = '#FAC775'

export default function UaMap({ marks = [], thread, label, showAll = true }: {
  marks?: { city: City; color: string; label?: string }[]
  thread?: [City, City]
  label?: string
  showAll?: boolean
}) {
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
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={label ?? 'Мапа України'} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <g>
        <path d={UA_PATH + CRIMEA_PATH} fill="none" stroke={EDGE} strokeWidth={2.4} strokeLinejoin="round" />
        <path d={UA_PATH + CRIMEA_PATH} fill={LAND} stroke={LAND} strokeWidth={1.6} strokeLinejoin="round" />
      </g>
      {showAll && CITIES.map((c) => {
        const [x, y] = project(c.lat, c.lon)
        return <circle key={c.n} cx={x} cy={y} r={c.obl ? 3.2 : 2.2} fill={c.tot ? '#9FB4CC' : '#CFE3FA'} opacity={0.75} />
      })}
      {threadPath && (
        <path d={threadPath} fill="none" stroke="#FFD78A" strokeWidth={3} strokeDasharray="7 6" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" from="130" to="0" dur="1.6s" fill="freeze" />
        </path>
      )}
      {marks.map(({ city, color, label: l }) => {
        const [x, y] = project(city.lat, city.lon)
        const right = x < VIEW_W - 170
        return (
          <g key={city.n + color}>
            <circle cx={x} cy={y} r={11} fill={color} opacity={0.25} />
            <circle cx={x} cy={y} r={6.5} fill={color} stroke="#0E1A2B" strokeWidth={2} />
            <text x={right ? x + 12 : x - 12} y={y - 10} textAnchor={right ? 'start' : 'end'} fontSize={19} fontWeight={700} fill="#FFFFFF" stroke="#0E1A2B" strokeWidth={4} paintOrder="stroke">{l ?? city.n}</text>
          </g>
        )
      })}
    </svg>
  )
}
