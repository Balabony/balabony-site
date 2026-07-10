// Єдине джерело правди для тривалості читання/прослуховування.
// Рахує з ОПУБЛІКОВАНОЇ версії тексту (тієї, що бачить читач), дільник 150 слів/хв
// (темп читання вголос українською — чесний для аудіоверсій).
// НЕ використовуйте duration_minutes із БД: воно застаріває після редагування тексту.

const WORDS_PER_MINUTE = 150

type EpisodeTextFields = {
  text?: string | null
  corrected_text?: string | null
  humanized_text?: string | null
  published_version?: string | null
}

/** Повертає текст тієї версії, яку реально показують читачеві. */
export function publishedBody(ep: EpisodeTextFields): string {
  const v = ep.published_version ?? 'original'
  if ((v === 'humanized' || v === 'corrected_humanized') && ep.humanized_text) return ep.humanized_text
  if (v === 'corrected' && ep.corrected_text) return ep.corrected_text
  return ep.text ?? ''
}

export function countWords(text?: string | null): number {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Хвилини читання опублікованої версії. Мінімум 1, якщо текст є. */
export function readingMinutes(ep: EpisodeTextFields): number {
  const words = countWords(publishedBody(ep))
  return words ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0
}
