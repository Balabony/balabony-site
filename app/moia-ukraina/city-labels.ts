// 12.11.2026: розстановка підписів міст у збільшеній області без накладань
// (напр. Сєвєродонецьк і Лисичанськ стоять майже в одній точці).
// Для кожного міста пробуємо позиції довкола крапки й беремо першу, що не перетинає
// вже поставлені підписи, крапки інших міст і не виходить за межі кадру.
import { project } from './ukraine-map'
import { CITIES } from './data'

export type Placed = { x: number; y: number; anchor: 'start' | 'end' | 'middle'; box: [number, number, number, number] }

type Box = [number, number, number, number]
const hit = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]
const area = (a: Box, b: Box) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]))

// vb — кадр, у якому показуємо область; px — ширина мапи на екрані.
export function placeLabels(names: string[], vb: [number, number, number, number], px: number, viewW: number): Record<string, Placed> {
  const k = vb[2] / viewW, sp = vb[2] / px
  const fs = (base: number, min: number) => Math.max(base * k, min * sp)
  const list = names.map((n) => CITIES.find((c) => c.n === n)).filter((c): c is NonNullable<typeof c> => !!c)
  // спершу обласні центри — їм найкраще місце
  list.sort((a, b) => Number(!!b.obl) - Number(!!a.obl))
  const dots: Box[] = list.map((c) => {
    const [x, y] = project(c.lat, c.lon)
    const r = fs(c.obl ? 4.4 : 3.2, c.obl ? 5 : 4) + fs(2, 2)
    return [x - r, y - r, x + r, y + r]
  })
  const frame: Box = [vb[0] + 2 * sp, vb[1] + 2 * sp, vb[0] + vb[2] - 2 * sp, vb[1] + vb[3] - 2 * sp]
  const taken: Box[] = []
  const out: Record<string, Placed> = {}
  list.forEach((c, i) => {
    const [x, y] = project(c.lat, c.lon)
    const f = fs(c.obl ? 16 : 14, c.obl ? 15 : 13)
    const w = c.n.length * f * 0.6 + f * 0.3
    const g = fs(8, 8)
    const asc = f * 0.78, desc = f * 0.24
    // [x тексту, базова лінія, вирівнювання]
    const cand: [number, number, Placed['anchor']][] = [
      [x + g, y + f * 0.33, 'start'],
      [x - g, y + f * 0.33, 'end'],
      [x + g * 0.6, y - g * 0.6, 'start'],
      [x + g * 0.6, y + g * 0.6 + asc, 'start'],
      [x - g * 0.6, y - g * 0.6, 'end'],
      [x - g * 0.6, y + g * 0.6 + asc, 'end'],
      [x, y - g * 1.1, 'middle'],
      [x, y + g * 1.1 + asc, 'middle'],
      [x + g, y - f * 0.9, 'start'],
      [x + g, y + f * 1.5, 'start'],
      [x - g, y - f * 0.9, 'end'],
      [x - g, y + f * 1.5, 'end'],
    ]
    let best: Placed | null = null, bestCost = Infinity
    for (const [tx, ty, anchor] of cand) {
      const x0 = anchor === 'start' ? tx : anchor === 'end' ? tx - w : tx - w / 2
      const box: Box = [x0, ty - asc, x0 + w, ty + desc]
      let cost = 0
      for (const t of taken) cost += area(box, t) * 10
      dots.forEach((d, j) => { if (j !== i && hit(box, d)) cost += area(box, d) * 10 + 1 })
      // вихід за кадр
      const out0 = Math.max(0, frame[0] - box[0]) + Math.max(0, box[2] - frame[2]) + Math.max(0, frame[1] - box[1]) + Math.max(0, box[3] - frame[3])
      cost += out0 * f * 5
      if (cost < bestCost) { bestCost = cost; best = { x: tx, y: ty, anchor, box } }
      if (cost === 0) break
    }
    taken.push(best!.box)
    out[c.n] = best!
  })
  return out
}
