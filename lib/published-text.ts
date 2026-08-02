/**
 * Яка саме версія тексту вважається опублікованою.
 *
 * У кожного твору може бути до трьох варіантів: оригінал автора (`text`),
 * вичитаний редактором (`corrected_text`) і опрацьований (`humanized_text`).
 * Який із них показувати, вирішує поле `published_version`.
 *
 * Логіка була лише в API, а сторінки списків брали `text` напряму — через це
 * в анонсі міг стояти невичитаний текст, тоді як у читалці був виправлений.
 * Тепер правило одне на всіх.
 */

export interface VersionedText {
  text: string
  corrected_text?: string | null
  humanized_text?: string | null
  published_version?: string | null
}

export function pickPublishedText(row: VersionedText): string {
  const v = row.published_version ?? 'original'
  if ((v === 'humanized' || v === 'corrected_humanized') && row.humanized_text) {
    return row.humanized_text
  }
  if (v === 'corrected' && row.corrected_text) return row.corrected_text
  return row.text
}
