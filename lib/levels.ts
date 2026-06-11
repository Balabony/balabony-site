// Рівні читача за кількістю УНІКАЛЬНИХ прочитаних серій.
// Детерміновано, без балів (бонусна програма поки макет), без лідербордів.

export interface ReaderLevel {
  key:   string
  title: string
  min:   number   // поріг входу в рівень (унікальних серій)
}

export const LEVELS: ReaderLevel[] = [
  { key: 'beginner', title: 'Початківець',       min: 0  },
  { key: 'reader',   title: 'Читач',             min: 1  },
  { key: 'bookworm', title: 'Книгочій',          min: 10 },
  { key: 'expert',   title: 'Знавець Балабонів', min: 30 },
]

export function levelFromReads(total: number): {
  current: ReaderLevel
  next:    ReaderLevel | null
  idx:     number
} {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (total >= LEVELS[i].min) idx = i
  }
  return { current: LEVELS[idx], next: LEVELS[idx + 1] ?? null, idx }
}
