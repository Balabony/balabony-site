/**
 * «Афіша без бар'єрів» — події, де є аудіодескрипція, субтитри, жестова мова
 * або доступний зал. Почали 13.11.2026 зі Львова.
 *
 * ЯК ДОДАТИ ПОДІЮ: новий об'єкт у EVENTS. Дата — 'YYYY-MM-DD'. Минулі події
 * сторінка ховає сама (перезбирається щогодини). Кожна подія — з джерелом:
 * формат доступності вписуємо лише той, який організатор назвав сам.
 */
export type Access = 'audio' | 'subs' | 'sign' | 'wheel' | 'braille'

export const ACCESS_LABEL: Record<Access, string> = {
  audio: 'Аудіодескрипція',
  subs: 'Розширені субтитри',
  sign: 'Жестова мова',
  wheel: 'Доступ на візку',
  braille: 'Брайль',
}

export type AfishaEvent = {
  date: string
  time?: string
  title: string
  kind: 'Вистава' | 'Кіно' | 'Читання' | 'Виставка' | 'Концерт' | 'Зустріч'
  venue: string
  city: string
  access: Access[]
  note: string
  book?: string
  source: string
}

const LESI_BOOK = 'Квиток на виставу + попросіть аудіодескрипцію в адміністрації заздалегідь: 063 655 12 94 (вт–нд, 11:00–18:00).'
const LESI_SRC = 'https://teatrlesi.lviv.ua/yak-teatr-lesi-adaptovuye-vystavy-dlya-lyudej-z-porushennyamy-zoru/'

export const EVENTS: AfishaEvent[] = [
  { date: '2026-11-15', time: '18:00', title: 'Плейлист подорожнього', kind: 'Вистава', venue: 'Театр Лесі', city: 'Львів', access: ['audio'], note: 'Аудіодескрипцію театр забезпечує на запит.', book: LESI_BOOK, source: LESI_SRC },
  { date: '2026-11-20', time: '18:00', title: 'Жага', kind: 'Вистава', venue: 'Театр Лесі', city: 'Львів', access: ['audio'], note: 'За мотивами «Камінного господаря» Лесі Українки. Аудіодескрипція на запит.', book: LESI_BOOK, source: LESI_SRC },
  { date: '2026-12-04', time: '18:00', title: 'Жага', kind: 'Вистава', venue: 'Театр Лесі', city: 'Львів', access: ['audio'], note: 'За мотивами «Камінного господаря» Лесі Українки. Аудіодескрипція на запит.', book: LESI_BOOK, source: LESI_SRC },
  { date: '2026-12-17', time: '18:00', title: 'Клуб «Зневіра»', kind: 'Вистава', venue: 'Театр Лесі', city: 'Львів', access: ['audio'], note: 'За мотивами «Intermezzo» Михайла Коцюбинського. Аудіодескрипція на запит.', book: LESI_BOOK, source: LESI_SRC },
]

export function upcoming(today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })): AfishaEvent[] {
  return EVENTS.filter((e) => e.date >= today).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
}
