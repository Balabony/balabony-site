/**
 * 15.11.2026 (рішення Богдана): назви творів ВЕЛИКИМИ ЛІТЕРАМИ заборонені
 * («НЕ БУДЕ ТАМ ЩАСТЯ», «ТІЛО РОШЕН»). Автор пише назву звичайно:
 * велика літера лише на початку та у власних назвах.
 */
export function isAllCapsTitle(title: string): boolean {
  const letters = title.match(/\p{L}/gu) ?? []
  if (letters.length < 4) return false
  return !/\p{Ll}/u.test(title)
}

export const ALL_CAPS_ERROR =
  'Назву не можна писати великими літерами. Напишіть її звичайно: з великої літери лише перше слово та власні назви.'
