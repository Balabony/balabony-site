import type { CSSProperties } from 'react'

/**
 * Кадрування обкладинки: одна функція для всіх карток сайту.
 *
 * У полі `cover_position` живуть ДВА формати, обидва законні:
 *
 *   1. CSS object-position — `center`, `top`, `center 40%`.
 *      Так пише випадаючий список у редакторі твору. Таких значень ~1330.
 *
 *   2. Рамка з перетягуванням — `scale:130 x:-4 y:6`.
 *      Так пише візуальний редактор /admin/cover-position, де обкладинку
 *      можна тягнути мишею й наближати. Таких значень 25.
 *
 * Другий формат — НЕ валідний CSS. Поки картки підставляли значення просто
 * в objectPosition, браузер мовчки відкидав його, і робота, зроблена
 * перетягуванням, ніде не була видна. Ця функція розбирає обидва.
 *
 * Логіку взято з FreshStoriesGrid, де вона вже була відпрацьована, —
 * тут вона просто стала спільною.
 */

/** Типове кадрування, якщо нічого не задано: трохи вище центру. */
export const DEFAULT_COVER_POSITION = '50% 10%'

export function coverStyle(
  coverPosition: string | null | undefined,
  fallback: string = DEFAULT_COVER_POSITION,
): CSSProperties {
  if (!coverPosition || coverPosition === 'center') {
    return { objectPosition: fallback }
  }

  const m = coverPosition.match(/scale:(-?\d+)\s+x:(-?\d+)\s+y:(-?\d+)/)
  if (m) {
    const scale = Math.max(100, Math.min(400, parseInt(m[1], 10)))
    // Найбільший припустимий зсув. У `translate(x%) scale(s)` відсоток
    // рахується від розміру елемента, а масштабування йде ПІСЛЯ, тож
    // справжній зсув дорівнює x × s. Запас із боку — (s − 1) / 2, отже
    // x = 50 × (s − 100) / s. Стара формула (scale − 100) / 2 давала втричі
    // більше при наближенні 300%: обличчя виїжджало за кадр.
    const limit = scale <= 100 ? 0 : Math.max(0, (50 * (scale - 100)) / scale)
    const tx = Math.max(-limit, Math.min(limit, parseInt(m[2], 10)))
    const ty = Math.max(-limit, Math.min(limit, parseInt(m[3], 10)))
    return {
      transform: `translate(${tx}%, ${ty}%) scale(${scale / 100})`,
      transformOrigin: 'center center',
    }
  }

  if (/^\s*[\d.]+%/.test(coverPosition) || /^(left|right|center|top|bottom)/.test(coverPosition)) {
    return { objectPosition: coverPosition }
  }

  return { objectPosition: fallback }
}
