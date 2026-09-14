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
  /**
   * Поріг допуску до призових місць — скільки зарахованих дочитувань
   * має набрати робота. До 12.09.2026 ці числа жили тільки в текстах
   * правил; у коді їх не було, тому перевірити поріг було неможливо.
   */
  threshold: number
  /**
   * Етапи після закриття прийому.
   *
   * Заповнено 13.09.2026, після публікації умов. До того тут стояв null
   * («дату ще не визначено»), бо строки залежали від скасування різдвяної
   * паузи.
   *
   * publishFrom, publishUntil і resultsAt узяті з ОПУБЛІКОВАНИХ умов на
   * /konkursy — міняти їх тут, не змінивши сторінку, не можна.
   * reviewUntil і scoresUntil — внутрішні віхи редакції, на сайті їх немає:
   * редактори дочитують до кінця зарахування дочитувань, бали виставляють
   * за два дні до підсумків.
   *
   * Формат — YYYY-MM-DD, як у opensAt / closesAt.
   */
  stages: {
    /** Перша серія виходить на сайті. */
    publishFrom:  string | null
    /** Остання серія виходить. */
    publishUntil: string | null
    /** До цієї дати редактори мають дочитати. */
    reviewUntil:  string | null
    /** До цієї дати виставлені всі бали. */
    scoresUntil:  string | null
    /** Оголошення підсумків. */
    resultsAt:    string | null
  }
}

export const CONTESTS: Contest[] = [
  {
    id: 'ce-dovha-istoriya',
    threshold: 50,
    name: '«Це довга історія» — конкурс серіалів',
    episodes: 10,
    minWords: 1500,
    maxWords: 1800,
    atOnce: false,
    opensAt: '2026-09-01',
    closesAt: '2026-10-31',
    hint: 'Десять серій по 1500–1800 слів. Серії можна досилати по черзі, у міру написання.',
    // Старт 25.11.2026, далі щотижня. Різдвяної паузи немає (рішення 11.09.2026,
    // підтверджено 14.09.2026). Кожен автор виходить у СВІЙ день тижня, перші
    // серії — 25.11–01.12, тому десята серія найпізнішого учасника припадає на
    // 02.02.2027, а не на 27.01: остання дата стосувалася лише тих, хто почав
    // у середу. Дочитування рахуємо три тижні від неї.
    stages: {
      publishFrom:  '2026-11-25',
      publishUntil: '2027-02-02',
      reviewUntil:  '2027-02-23',
      scoresUntil:  '2027-03-01',
      resultsAt:    '2027-03-03',
    },
  },
  {
    id: 'pyat-vechoriv',
    threshold: 50,
    name: "«П'ять вечорів»",
    episodes: 5,
    minWords: 900,
    maxWords: 1100,
    atOnce: true,
    opensAt: '2026-09-01',
    closesAt: '2026-10-20',
    hint: "П'ять серій по 900–1100 слів. За правилами конкурсу надсилаються всі п'ять одразу.",
    // 3–17 листопада, вівторок і п'ятниця. У 2026-му це саме ці дні:
    // 3, 6, 10, 13 і 17 листопада. Стара редакція «4–18» давала середи.
    stages: {
      publishFrom:  '2026-11-03',
      publishUntil: '2026-11-17',
      reviewUntil:  '2026-12-08',
      scoresUntil:  '2026-12-10',
      resultsAt:    '2026-12-11',
    },
  },
  {
    id: 'odyn-den',
    threshold: 50,
    name: '«Один день, який усе змінив»',
    episodes: 1,
    minWords: 300,
    maxWords: 1500,
    atOnce: true,
    opensAt: '2026-11-01',
    closesAt: '2026-12-15',
    hint: 'Одна історія до 1500 слів.',
    stages: {
      publishFrom: '2027-01-12', publishUntil: '2027-01-29',
      reviewUntil: '2027-02-23', scoresUntil: '2027-03-01', resultsAt: '2027-03-02',
    },
  },
  {
    id: 'z-viterczem',
    threshold: 50,
    name: '«З вітерцем»',
    episodes: 1,
    minWords: 300,
    maxWords: 1500,
    atOnce: true,
    opensAt: '2026-11-01',
    closesAt: '2026-12-15',
    hint: 'Одна гумористична історія до 1500 слів.',
    stages: {
      publishFrom: '2027-01-12', publishUntil: '2027-01-29',
      reviewUntil: '2027-02-23', scoresUntil: '2027-03-01', resultsAt: '2027-03-02',
    },
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
