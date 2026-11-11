'use client'

import { useEffect, useRef, useState } from 'react'
import { VIEW_W, VIEW_H, project } from './ukraine-map'
import { REGIONS, type Region } from './ua-regions'
import { CITIES, TOT_NOTE, type City } from './data'

// Мапа України з Кримом, межами й назвами областей.
// 11.11.2026: наведення/дотик до крапки показує назву міста, клік обирає місто (onPick),
// клік по мапі повертає координати (onMapClick) — для гри «Знайди на мапі».
// 11.11.2026: межі областей; у режимі regions="zoom" клік по області збільшує її з назвами міст.
const LAND = '#1E3A5C'
const LAND_ON = '#27507E'
const BORDER = '#5C82AE'
const EDGE = '#FAC775'
const KX = project(0, 23)[0] // = cos(48.4°)·60 — масштаб по довготі
const FULL: [number, number, number, number] = [0, 0, VIEW_W, VIEW_H]

// Довгі назви в повному вигляді переносимо на два рядки, малим областям — менший шрифт.
const LAB: Record<string, { t?: string[]; s?: number; dx?: number; dy?: number }> = {
  'UA-12': { t: ['Дніпропет-', 'ровська'] },
  'UA-26': { t: ['Івано-', 'Франківська'], s: 9 },
  'UA-21': { t: ['Закарпат-', 'ська'], s: 9.5, dx: 4 },
  'UA-77': { s: 8.5, dx: 6, dy: 9 },
  'UA-61': { t: ['Терно-', 'пільська'], s: 9.5 },
  'UA-68': { t: ['Хмель-', 'ницька'] },
  'UA-46': { dx: 4 },
  'UA-32': { dy: 26 },
  'UA-71': { dx: 4 },
  'UA-35': { t: ['Кірово-', 'градська'] },
  'UA-48': { t: ['Микола-', 'ївська'], dx: -8, dy: -12 },
  'UA-51': { dx: 10, dy: -10 },
  'UA-65': { dx: -6, dy: -4 },
  'UA-43': { dy: -4 },
  'UA-53': { dx: -4 },
  'UA-74': { t: ['Черні-', 'гівська'] },
}
export const zoomOf = (r: Region) => (r.id === 'UA-30' ? REGIONS.find((x) => x.id === 'UA-32')! : r.id === 'UA-40' ? REGIONS.find((x) => x.id === 'UA-43')! : r)

// Географічний шар: головні річки, моря, Карпати, Говерла, столиця. Координати — опорні точки русел (спрощено).
const RIVERS: { n: string; pts: [number, number][]; lab: [number, number] }[] = [
  { n: 'Дніпро', pts: [[51.5, 30.6], [50.45, 30.55], [49.75, 31.46], [49.44, 32.06], [49.07, 33.42], [48.46, 35.04], [47.84, 35.14], [47.57, 34.4], [46.75, 33.37], [46.64, 32.61], [46.52, 32.1]], lab: [49.2, 32.7] },
  { n: 'Дністер', pts: [[49.25, 22.95], [49.12, 24.72], [48.51, 26.49], [48.45, 27.8], [48.13, 28.28], [47.26, 29.16], [46.6, 29.9], [46.3, 30.2]], lab: [48.75, 25.6] },
  { n: 'Південний Буг', pts: [[49.6, 26.6], [49.42, 27.0], [49.23, 28.47], [48.33, 29.87], [48.04, 30.85], [47.57, 31.33], [46.97, 31.99], [46.62, 31.9]], lab: [48.6, 29.0] },
  { n: 'Десна', pts: [[52.0, 33.26], [51.49, 31.29], [50.75, 30.75], [50.55, 30.55]], lab: [51.7, 32.2] },
  { n: 'Дунай', pts: [[45.5, 28.2], [45.45, 28.28], [45.35, 28.84], [45.45, 29.27], [45.4, 29.6], [45.35, 29.75]], lab: [45.05, 28.5] },
]
function GeoLayer({ k, names }: { k: number; names: boolean }) {
  const P = (lat: number, lon: number) => project(lat, lon)
  const line = (pts: [number, number][]) => pts.map(([a, b], i) => { const [x, y] = P(a, b); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}` }).join('')
  const txt = (lat: number, lon: number, s: string, size: number, fill: string, italic = false) => { const [x, y] = P(lat, lon); return <text x={x} y={y} fontSize={size * k} fill={fill} fontStyle={italic ? 'italic' : 'normal'} fontWeight={600} textAnchor="middle" opacity={0.9} stroke="#0E1A2B" strokeWidth={3 * k} paintOrder="stroke">{s}</text> }
  const [hx, hy] = P(48.16, 24.5)
  const [kx, ky] = P(50.45, 30.52)
  const s = k
  return (
    <g pointerEvents="none">
      {RIVERS.map((r) => <path key={r.n} d={line(r.pts)} fill="none" stroke="#5AA9FF" strokeWidth={2.2 * k} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />)}
      {!names && RIVERS.map((r) => <g key={r.n + 't'}>{txt(r.lab[0], r.lab[1], r.n, 13, '#8CC4FF', true)}</g>)}
      {txt(44.55, 31.2, 'Чорне море', 20, '#6FA8E8', true)}
      {txt(46.2, 37.0, 'Азовське море', 15, '#6FA8E8', true)}
      {!names && txt(48.75, 23.35, 'Карпати', 14, '#B7D7A8', true)}
      <path d={`M${hx} ${hy - 9 * s} L${hx + 8 * s} ${hy + 5 * s} L${hx - 8 * s} ${hy + 5 * s} Z`} fill="#B7D7A8" />
      {!names && txt(47.92, 24.5, 'Говерла 2061 м', 12, '#B7D7A8')}
      <path d={`M${kx} ${ky - 13 * s} L${kx + 3.5 * s} ${ky - 4 * s} L${kx + 13 * s} ${ky - 4 * s} L${kx + 5.5 * s} ${ky + 2 * s} L${kx + 8.5 * s} ${ky + 11 * s} L${kx} ${ky + 5.5 * s} L${kx - 8.5 * s} ${ky + 11 * s} L${kx - 5.5 * s} ${ky + 2 * s} L${kx - 13 * s} ${ky - 4 * s} L${kx - 3.5 * s} ${ky - 4 * s} Z`} fill="#FFD700" stroke="#0057B7" strokeWidth={1.5 * s} />
    </g>
  )
}

const regionTitle = (r: Region) => (r.n === 'АР Крим' ? 'Автономна Республіка Крим' : `${r.n} область`)

export function unproject(x: number, y: number) {
  return { lat: 52.5 - y / 60, lon: 22 + x / KX }
}

// Межі збільшення: область + підписи її міст (вони стоять праворуч від крапки), щоб усе було по центру.
function fit(r: Region, px: number): [number, number, number, number] {
  const ratio = VIEW_W / VIEW_H
  let [x0, y0, x1, y1] = r.box
  let w = 0
  for (let pass = 0; pass < 3; pass++) {
    const bw = (x1 - x0) * 1.2, bh = (y1 - y0) * 1.2
    w = Math.max(bw, bh * ratio, 170)
    const k = w / VIEW_W, sp = w / px
    for (const n of r.cities) {
      const c = CITIES.find((q) => q.n === n)
      if (!c) continue
      const [x] = project(c.lat, c.lon)
      const f = Math.max((c.obl ? 16 : 14) * k, (c.obl ? 15 : 13) * sp)
      x1 = Math.max(x1, x + 8 * Math.max(k, sp) + n.length * f * 0.6)
    }
  }
  const h = w / ratio
  return [(x0 + x1) / 2 - w / 2, (y0 + y1) / 2 - h / 2, w, h]
}

export default function UaMap({ marks = [], thread, label, showAll = true, onPick, onMapClick, active, geo = false, regions = 'lines', onRegion, regionFill, onRegionClick, regionLabel }: {
  marks?: { city: City; color: string; label?: string }[]
  thread?: [City, City]
  label?: string
  showAll?: boolean
  onPick?: (c: City) => void
  onMapClick?: (lat: number, lon: number) => void
  active?: string
  geo?: boolean
  regions?: 'lines' | 'names' | 'zoom'
  onRegion?: (r: Region | null) => void
  regionFill?: Record<string, string>
  onRegionClick?: (r: Region) => void
  regionLabel?: Record<string, string>
}) {
  const [hover, setHover] = useState<City | null>(null)
  const [hoverR, setHoverR] = useState<string | null>(null)
  const [zoom, setZoom] = useState<Region | null>(null)
  const [vb, setVb] = useState(FULL)
  const vbRef = useRef(FULL)
  const svg = useRef<SVGSVGElement>(null)
  const [px, setPx] = useState(730) // ширина мапи на екрані — щоб підписи на телефоні не ставали дрібними
  useEffect(() => {
    const el = svg.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setPx(e.contentRect.width || 730))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const zoomable = regions === 'zoom'
  const names = regions !== 'lines'

  // Плавне збільшення: анімуємо viewBox; для тих, хто обрав «менше руху», — одразу.
  useEffect(() => {
    const to = zoom ? fit(zoom, px) : FULL
    const from = vbRef.current
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { vbRef.current = to; setVb(to); return }
    let raf = 0
    const t0 = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 450)
      const e = 1 - Math.pow(1 - p, 3)
      const cur = from.map((v, i) => v + (to[i] - v) * e) as [number, number, number, number]
      vbRef.current = cur; setVb(cur)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [zoom, px])

  const k = vb[2] / VIEW_W
  const sp = vb[2] / px // одиниць мапи на 1 пiксель екрана
  const fs = (base: number, min: number) => Math.max(base * k, min * sp)
  const inZoom = zoom ? new Set(zoom.cities) : null

  function choose(r: Region | null) {
    const z = r ? zoomOf(r) : null
    setZoom(z); setHover(null); onRegion?.(z)
  }

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
  const ALL = REGIONS.map((r) => r.d).join('')
  return (
    <div style={{ position: 'relative' }}>
      {zoom && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '2px 2px 8px' }}>
          <button type="button" onClick={() => choose(null)}
            style={{ background: '#FFD700', color: '#0E1A2B', border: 0, borderRadius: 10, padding: '7px 12px', fontSize: 15, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ← Вся Україна
          </button>
          <b style={{ color: '#FFD700', fontSize: 16, textAlign: 'right' }}>{regionTitle(zoom)}</b>
        </div>
      )}
      <svg ref={svg} viewBox={vb.map((v) => v.toFixed(2)).join(' ')} role="img" aria-label={zoom ? `${label ?? 'Мапа України'}: ${zoom.n === 'АР Крим' ? 'Автономна Республіка Крим' : zoom.n + ' область'}` : label ?? 'Мапа України'} onClick={click}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: onMapClick ? 'crosshair' : 'default', touchAction: 'manipulation' }}>
        <path d={ALL} fill="none" stroke={EDGE} strokeWidth={2.6 * k} strokeLinejoin="round" pointerEvents="none" />
        {REGIONS.map((r) => {
          const z = zoomOf(r)
          const on = zoom ? zoom.id === z.id : zoomable && hoverR === z.id
          const dim = zoom && !on
          return (
            <path key={r.id} d={r.d} fillRule="evenodd" fill={regionFill?.[z.id] ?? (on || (onRegionClick && hoverR === z.id) ? LAND_ON : LAND)} stroke={BORDER} strokeWidth={(on && zoom ? 1.6 : 0.9) * k} strokeLinejoin="round"
              opacity={dim ? 0.55 : 1}
              onMouseEnter={zoomable || onRegionClick ? () => setHoverR(z.id) : undefined} onMouseLeave={zoomable || onRegionClick ? () => setHoverR((h) => (h === z.id ? null : h)) : undefined}
              onClick={onRegionClick ? (e) => { e.stopPropagation(); onRegionClick(z) } : zoomable ? (e) => { e.stopPropagation(); if (zoom?.id !== z.id) choose(r) } : undefined}
              style={{ cursor: onRegionClick ? 'pointer' : zoomable && zoom?.id !== z.id ? 'zoom-in' : undefined, transition: 'fill .25s' }} />
          )
        })}
        {zoom && <path d={zoom.d + (zoom.id === 'UA-32' ? REGIONS.find((x) => x.id === 'UA-30')!.d : '')} fill="none" stroke="#FFD700" strokeWidth={2.2 * k} strokeLinejoin="round" pointerEvents="none" />}
        {geo && <GeoLayer k={k} names={names} />}
        {regionLabel && (
          <g pointerEvents="none">
            {REGIONS.filter((r) => regionLabel[r.id]).map((r) => {
              const o = LAB[r.id] ?? {}
              const size = Math.max((o.s ?? 10.5) * k, 11 * sp)
              return <text key={r.id} x={r.lab[0] + (o.dx ?? 0)} y={r.lab[1] + (o.dy ?? 0)} fontSize={size} fontWeight={800} fill="#fff" textAnchor="middle" stroke="#0E1A2B" strokeWidth={size / 4} paintOrder="stroke">{regionLabel[r.id]}</text>
            })}
          </g>
        )}
        {names && !zoom && px >= 480 && (
          <g pointerEvents="none">
            {REGIONS.filter((r) => r.id !== 'UA-30' && r.id !== 'UA-40').map((r) => {
              const o = LAB[r.id] ?? {}
              const lines = o.t ?? [r.n]
              const size = o.s ?? 10.5
              const x = r.lab[0] + (o.dx ?? 0), y = r.lab[1] + (o.dy ?? 0) - ((lines.length - 1) * size) / 2
              return (
                <text key={r.id} x={x} y={y} fontSize={size} fontWeight={700} fill="#E9F2FF" opacity={0.8} textAnchor="middle" stroke="#0E1A2B" strokeWidth={2.5} paintOrder="stroke" letterSpacing={0.2}>
                  {lines.map((l, i) => <tspan key={l} x={x} dy={i ? size * 1.05 : 0}>{l}</tspan>)}
                </text>
              )
            })}
          </g>
        )}
        {showAll && CITIES.map((c) => {
          const [x, y] = project(c.lat, c.lon)
          const on = hover?.n === c.n || active === c.n
          const mine = inZoom?.has(c.n)
          if (zoom && !mine) return null
          return (
            <g key={c.n}
              onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover((h) => (h?.n === c.n ? null : h))}
              onClick={onPick ? (e) => { e.stopPropagation(); setHover(c); onPick(c) } : undefined}
              onFocus={() => setHover(c)} onBlur={() => setHover(null)}
              onKeyDown={onPick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(c) } } : undefined}
              tabIndex={onPick ? 0 : -1} role={onPick ? 'button' : undefined} aria-label={onPick ? `${c.n}${c.tot ? '. ' + TOT_NOTE : ''}` : undefined}
              style={{ cursor: onPick ? 'pointer' : 'default', outline: 'none' }}>
              <circle cx={x} cy={y} r={fs(12, 10)} fill="transparent" />
              <circle cx={x} cy={y} r={zoom ? fs(on ? 7 : c.obl ? 4.4 : 3.2, on ? 8 : c.obl ? 5 : 4) : (on ? 7 : c.obl ? 3.4 : 2.4) * k} fill={on ? '#FFD700' : c.tot ? '#9FB4CC' : '#CFE3FA'} opacity={on ? 1 : 0.85}
                stroke={on ? '#0057B7' : 'none'} strokeWidth={on ? 2.5 * k : 0} />
              {zoom && !on && (
                <text x={x + fs(8, 8)} y={y + fs(5, 5)} fontSize={fs(c.obl ? 16 : 14, c.obl ? 15 : 13)} fontWeight={c.obl ? 800 : 600} fill="#fff" stroke="#0E1A2B" strokeWidth={fs(3.5, 3.5)} paintOrder="stroke" pointerEvents="none">{c.n}</text>
              )}
            </g>
          )
        })}
        {threadPath && (
          <path d={threadPath} fill="none" stroke="#FFD78A" strokeWidth={3 * k} strokeDasharray={`${7 * k} ${6 * k}`} strokeLinecap="round" pointerEvents="none">
            <animate attributeName="stroke-dashoffset" from="130" to="0" dur="1.6s" fill="freeze" />
          </path>
        )}
        {marks.map(({ city, color, label: l }) => {
          const [x, y] = project(city.lat, city.lon)
          const right = x < vb[0] + vb[2] - 170 * k
          return (
            <g key={city.n + color} pointerEvents="none">
              <circle cx={x} cy={y} r={11 * k} fill={color} opacity={0.25} />
              <circle cx={x} cy={y} r={6.5 * k} fill={color} stroke="#0E1A2B" strokeWidth={2 * k} />
              {(l ?? city.n) && <text x={right ? x + 12 * k : x - 12 * k} y={y - 10 * k} textAnchor={right ? 'start' : 'end'} fontSize={19 * k} fontWeight={700} fill="#FFFFFF" stroke="#0E1A2B" strokeWidth={4 * k} paintOrder="stroke">{l ?? city.n}</text>}
            </g>
          )
        })}
        {tip && showAll && (() => {
          const [x, y] = project(tip.lat, tip.lon)
          const w = (Math.max(70, tip.n.length * 11 + 24) + (tip.tot ? 120 : 0)) * k
          const hgt = 32 * k
          const left = Math.min(Math.max(x - w / 2, vb[0] + 4 * k), vb[0] + vb[2] - w - 4 * k)
          const top = y - vb[1] > 60 * k ? y - 46 * k : y + 14 * k
          return (
            <g pointerEvents="none">
              <rect x={left} y={top} width={w} height={hgt} rx={9 * k} fill="#0E1A2B" stroke="#FFD700" strokeWidth={1.5 * k} />
              <text x={left + w / 2} y={top + 21 * k} textAnchor="middle" fontSize={17 * k} fontWeight={800} fill="#fff">
                {tip.n}{tip.tot ? <tspan fill="#FAC775" fontWeight={600}> · памʼятаємо</tspan> : null}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
