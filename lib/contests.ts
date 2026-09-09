/**
 * Опис конкурсів в одному місці.
 *
 * Раніше правила жили лише текстом на /konkursy. Форма подачі мусить ті самі
 * межі перевіряти машинно, тому числа винесені сюди: інакше правило на
 * сторінці й перевірка в API розійдуться, і автор дізнається про розбіжність
 * уже після відмови.
 *
 * `episodes` — скільки серій має твір. `atOnce` — чи можна досилати серії
 * потроху. У «П'яти вечорах» правила прямо кажуть «усі п'ять одразу»,
 * у серіалі серії виходять щотижня, тож там прийом по черзі.
 */

export type ContestId =
  | 'ce-dovha-istoriya'
  | 'pyat-vechoriv'
  | 'odyn-den'
  | 'z-viterczem'

export interface Contest {
  id: ContestId
  name: string
  /** Скільки серій у творі. 1 — коротка проза. */
  episodes: number
  minWords: number
  maxWords: number
  /** true — всі серії за один раз; false — можна досилати по черзі. */
  atOnce: boolean
  /** Прийом заявок, включно з обома датами. */
  opensAt: string
  closesAt: string
  /** Що показати автору під вибором конкурсу. */
  hint: string
}

export const CONTESTS: Contest[] = [
  {
    id: 'ce-dovha-istoriya',
    name: '«Це довга історія» — конкурс серіалів',
    episodes: 10,
    minWords: 1500,
    maxWords: 1800,
    atOnce: false,
    opensAt: '2026-09-01',
    closesAt: '2026-10-31',
    hint: 'Десять серій по 1500–1800 слів. Серії можна досилати по черзі, у міру написання.',
  },
  {
    id: 'pyat-vechoriv',
    name: "«П'ять вечорів»",
    episodes: 5,
    minWords: 900,
    maxWords: 1100,
    atOnce: true,
    opensAt: '2026-09-01',
    closesAt: '2026-10-20',
    hint: "П'ять серій по 900–1100 слів. За правилами конкурсу надсилаються всі п'ять одразу.",
  },
  {
    id: 'odyn-den',
    name: '«Один день, який усе змінив»',
    episodes: 1,
    minWords: 300,
    maxWords: 1500,
    atOnce: true,
    opensAt: '2026-11-01',
    closesAt: '2026-12-15',
    hint: 'Одна історія до 1500 слів.',
  },
  {
    id: 'z-viterczem',
    name: '«З вітерцем»',
    episodes: 1,
    minWords: 300,
    maxWords: 1500,
    atOnce: true,
    opensAt: '2026-11-01',
    closesAt: '2026-12-15',
    hint: 'Одна гумористична історія до 1500 слів.',
  },
]

export function findContest(id: string): Contest | undefined {
  return CONTESTS.find(c => c.id === id)
}

/**
 * Чи відкрито прийом. Порівнюємо самі дати, без часу: день закриття
 * вважається робочим до кінця, як і написано в правилах.
 */
export function isOpen(c: Contest, now: Date = new Date()): boolean {
  const today = now.toISOString().slice(0, 10)
  return today >= c.opensAt && today <= c.closesAt
}

/** Слова рахуємо однаково у формі, в API і в листі — інакше цифри розійдуться. */
export function countWords(text: string): number {
  const t = text.trim()
  if (!t) return 0
  return t.split(/\s+/).length
}
