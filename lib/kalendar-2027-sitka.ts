/**
 * Сітка календаря на 2027 рік.
 *
 * Рахується тут, а не забивається руками: руками в такій таблиці
 * гарантовано з'явиться помилка на кшталт «31 листопада», яка вже була
 * в одному з макетів. Функція будує тижні від понеділка, як прийнято
 * в Україні.
 *
 * 2027 — невисокосний, 365 днів, починається в п'ятницю.
 *
 * Літературні дати лежать окремо, у lib/kalendar-2027.ts: сітка потрібна
 * на всіх чотирьох сторінках, дати — лише на головній.
 */

export const YEAR = 2027

export const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
] as const

/** Скорочення для шапки таблиці. Повні назви — в abbr. */
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] as const

export const WEEKDAYS_FULL = [
  'понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота', 'неділя',
] as const

/**
 * Тижні місяця: масив рядків по 7 клітинок.
 * null — порожня клітинка до першого або після останнього числа.
 */
export function monthWeeks(year: number, monthIndex: number): (number | null)[][] {
  const first = new Date(Date.UTC(year, monthIndex, 1))
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()

  // getUTCDay(): 0 — неділя. Зсуваємо так, щоб 0 був понеділок.
  const lead = (first.getUTCDay() + 6) % 7

  const cells: (number | null)[] = Array(lead).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** true для суботи й неділі — за позицією в тижні, не за датою. */
export function isWeekendColumn(col: number): boolean {
  return col >= 5
}
