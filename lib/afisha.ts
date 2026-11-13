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

/**
 * 13.11.2026: «Скоро в кіно» — анонси від партнера Kinomania Film Distribution (PR: Дарина Бордун),
 * 1–2 на тиждень. Формати доступності сеансів (субтитри, аудіодескрипція) уточнюємо в дистрибʼютора
 * і дописуємо в access, лише коли їх підтвердили.
 */
export type Premiere = {
  date: string
  title: string
  studio: string
  genre: string
  director?: string
  cast?: string
  about: string
  trailer?: string
  distributor: string
  access?: Access[]
}

export const PREMIERES: Premiere[] = [
  {
    date: '2027-03-04',
    title: 'Ґатто: девʼять життів Неро',
    studio: 'Pixar Animation Studios, Walt Disney Pictures',
    genre: 'анімація, пригоди, комедія, сімейний',
    director: 'Енріко Казароза («Лука»)',
    cast: 'Марк Руффало, Лоуренс Фішберн (оригінальне озвучення)',
    about: 'Кмітливий чорний кіт Неро роками блукає каналами забобонної Венеції й починає сумніватися, чи правильно прожив свої життя. Борг перед котячим мафіозі Рокко загрожує його майбутньому, і Неро доводиться завести найнесподіванішу дружбу у своєму житті. Саме вона може допомогти йому знайти справжнє призначення — якщо Венеція не візьме гору раніше.',
    trailer: 'https://www.youtube.com/watch?v=tRD0PHLOwOM',
    distributor: 'Kinomania Film Distribution',
  },
]

export function upcomingPremieres(today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })): Premiere[] {
  return PREMIERES.filter((p) => p.date >= today).sort((a, b) => a.date.localeCompare(b.date))
}

/** 13.11.2026: записи з адмінки (/admin/afisha, таблиця afisha_items) — до вписаних у код. */
type Row = { kind: 'event' | 'film'; date: string; time: string | null; title: string; category: string | null; venue: string | null; city: string | null; studio: string | null; genre: string | null; director: string | null; cast_text: string | null; about: string | null; book: string | null; trailer: string | null; source: string | null; distributor: string | null; access: string[] | null }
const KINDS = ['Вистава', 'Кіно', 'Читання', 'Виставка', 'Концерт', 'Зустріч'] as const
export function fromRows(rows: Row[]): { events: AfishaEvent[]; films: Premiere[] } {
  const acc = (a: string[] | null) => (a || []).filter((x): x is Access => x in ACCESS_LABEL)
  const events: AfishaEvent[] = [], films: Premiere[] = []
  for (const r of rows) {
    if (r.kind === 'film') films.push({ date: r.date, title: r.title, studio: r.studio || '', genre: r.genre || '', director: r.director || undefined, cast: r.cast_text || undefined, about: r.about || '', trailer: r.trailer || undefined, distributor: r.distributor || '', access: acc(r.access) })
    else events.push({ date: r.date, time: r.time || undefined, title: r.title, kind: (KINDS as readonly string[]).includes(r.category || '') ? (r.category as AfishaEvent['kind']) : 'Зустріч', venue: r.venue || '', city: r.city || '', access: acc(r.access), note: r.about || '', book: r.book || undefined, source: r.source || '' })
  }
  return { events, films }
}
