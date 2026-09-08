import type { CSSProperties } from 'react'

/**
 * Кадрування обкладинки: одна функція для всіх карток сайту.
 *
 * У полі `cover_position` живуть ТРИ формати, усі законні:
 *
 *   1. CSS object-position — `center`, `top`, `50% 20%`.
 *      Основний формат: так пише і випадаючий список у редакторі твору,
 *      і новий редактор, коли наближення не потрібне. Таких значень ~1330.
 *
 *   2. Точка фокуса з наближенням — `focus:50 20 scale:130`.
 *      Каже: тримати в кадрі точку (50%, 20%) і збільшити фото в 1,3 раза
 *      навколо неї.
 *
 *   3. Старий формат рамки — `scale:130 x:-4 y:6` (25 записів).
 *      Зсув рахувався від центру й працював лише за рахунок наближення,
 *      тому високо розташоване обличчя дістати було неможливо. Лишається
 *      для сумісності, нові значення в ньому не пишуться.
 *
 * Чому фокус кращий за рамку: object-position уміє притиснути фото до
 * верхнього краю БЕЗ жодного збільшення. У transform-моделі зсув можливий
 * лише в межах того, наскільки фото більше за рамку, тож при масштабі
 * 100% кадр не рухався взагалі.
 */

/** Типове кадрування, якщо нічого не задано: трохи вище центру. */
export const DEFAULT_COVER_POSITION = '50% 10%'

export type Focus = { x: number; y: number; scale: number }

export const DEFAULT_FOCUS: Focus = { x: 50, y: 50, scale: 100 }

function clampPct(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

export function clampFocus(f: Focus): Focus {
  return {
    x: clampPct(f.x),
    y: clampPct(f.y),
    scale: Math.max(100, Math.min(300, Math.round(f.scale))),
  }
}

/** Розбирає будь-який із трьох форматів у точку фокуса. */
export function parseFocus(value: string | null | undefined): Focus {
  if (!value) return DEFAULT_FOCUS

  const f = value.match(/focus:(-?\d+)\s+(-?\d+)(?:\s+scale:(-?\d+))?/)
  if (f) {
    return clampFocus({
      x: parseInt(f[1], 10),
      y: parseInt(f[2], 10),
      scale: f[3] ? parseInt(f[3], 10) : 100,
    })
  }

  // Старий формат рамки: зсув від центру в межах запасу від наближення.
  const t = value.match(/scale:(-?\d+)\s+x:(-?\d+)\s+y:(-?\d+)/)
  if (t) {
    const scale = Math.max(100, Math.min(300, parseInt(t[1], 10)))
    const span = scale <= 100 ? 0 : (50 * (scale - 100)) / scale
    const tx = span === 0 ? 0 : Math.max(-span, Math.min(span, parseInt(t[2], 10)))
    const ty = span === 0 ? 0 : Math.max(-span, Math.min(span, parseInt(t[3], 10)))
    // Зсув фото вниз означає, що в кадрі лишається його верхня частина.
    return clampFocus({
      x: span === 0 ? 50 : 50 - (tx / span) * 50,
      y: span === 0 ? 50 : 50 - (ty / span) * 50,
      scale,
    })
  }

  const named: Record<string, Focus> = {
    center: { x: 50, y: 50, scale: 100 },
    top: { x: 50, y: 0, scale: 100 },
    bottom: { x: 50, y: 100, scale: 100 },
    left: { x: 0, y: 50, scale: 100 },
    right: { x: 100, y: 50, scale: 100 },
  }
  const key = value.trim().toLowerCase()
  if (named[key]) return named[key]

  const css = key.match(/^(?:(left|right|center)|([\d.]+)%)\s+(?:(top|bottom|center)|([\d.]+)%)$/)
  if (css) {
    const xNamed: Record<string, number> = { left: 0, center: 50, right: 100 }
    const yNamed: Record<string, number> = { top: 0, center: 50, bottom: 100 }
    const x = css[1] ? xNamed[css[1]] : parseFloat(css[2])
    const y = css[3] ? yNamed[css[3]] : parseFloat(css[4])
    return clampFocus({ x, y, scale: 100 })
  }

  return DEFAULT_FOCUS
}

/**
 * Точка фокуса → значення для збереження.
 * Без наближення пишемо чистий CSS: таке значення розуміє будь-який код,
 * навіть той, що не користується цією утилітою.
 */
export function focusToValue(f: Focus): string {
  const c = clampFocus(f)
  if (c.scale === 100) return `${c.x}% ${c.y}%`
  return `focus:${c.x} ${c.y} scale:${c.scale}`
}

/** Точка фокуса → стилі для <img> у рамці з overflow: hidden. */
export function focusStyle(f: Focus): CSSProperties {
  const c = clampFocus(f)
  const base: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${c.x}% ${c.y}%`,
    display: 'block',
  }
  if (c.scale === 100) return base
  // Збільшуємо навколо тієї самої точки, тож вона лишається на місці.
  return {
    ...base,
    transform: `scale(${c.scale / 100})`,
    transformOrigin: `${c.x}% ${c.y}%`,
  }
}

/** Готові стилі кадрування просто зі значення поля. */
export function coverStyle(
  coverPosition: string | null | undefined,
  fallback: string = DEFAULT_COVER_POSITION,
): CSSProperties {
  if (!coverPosition || coverPosition === 'center') {
    return { objectPosition: fallback }
  }
  const s = focusStyle(parseFocus(coverPosition))
  // width/height/objectFit картки задають самі — віддаємо лише кадрування.
  return {
    objectPosition: s.objectPosition,
    transform: s.transform,
    transformOrigin: s.transformOrigin,
  }
}
