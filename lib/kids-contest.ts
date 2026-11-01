// 01.11.2026: дитячий конкурс «Скоромовка Балабонів» — умови в одному місці (сторінка, API, адмінка).
// Подає дорослий (батьки / законний представник / вчитель) після входу на Балабони; публікуємо лише ім'я, вік і місто дитини.

export const KIDS_CONTEST = {
  id: 'skoromovka-2026',
  title: '«Скоромовка Балабонів»',
  path: '/konkurs-skoromovok',
  start: '2026-11-10T00:00:00+02:00', // прийом з 10.11.2026
  end: '2026-12-05T00:00:00+02:00', // останній день — 04.12.2026
  startText: '10 листопада',
  endText: '4 грудня 2026 року',
  voteText: '5–11 грудня 2026 року',
  resultsText: '15 грудня 2026 року',
}

export const AGE_GROUPS = [
  { id: '1-4', label: '1–4 клас' },
  { id: '5-7', label: '5–7 клас' },
  { id: '8-11', label: '8–11 клас' },
  { id: 'rodynna', label: 'Родинна скоромовка (дитина разом із батьками)' },
] as const

export type AgeGroup = (typeof AGE_GROUPS)[number]['id']

export const MAX_PER_CHILD = 3
export const MAX_LINES = 4
export const MAX_CHARS = 400

export function contestState(now = Date.now()): 'soon' | 'open' | 'closed' {
  if (now < Date.parse(KIDS_CONTEST.start)) return 'soon'
  if (now >= Date.parse(KIDS_CONTEST.end)) return 'closed'
  return 'open'
}

export function groupLabel(id: string): string {
  return AGE_GROUPS.find((g) => g.id === id)?.label ?? id
}
