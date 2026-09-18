/**
 * ПЕРЕМОЖЦІ КОНКУРСІВ — єдине джерело для /konkursy і сторінок авторів.
 *
 * authorSlug ставимо ЛИШЕ тим, хто має профіль на Balabony (перевірено в
 * author_profiles). Решта показується без посилання й без знака на сторінці
 * автора, бо сторінки в них немає. Коли переможець зареєструється — досить
 * дописати сюди slug, і знак з'явиться сам.
 *
 * «Зірковий старт-2025»: підсумки оголошено 18.09.2026. На платформі на цю
 * дату лише Тетяна Біденко; Майстренко й Шевченко в базі не знайдені.
 */

export type Place = 1 | 2 | 3

export type Award = {
  contest: string
  place: Place
  name: string
  /** Справжнє ім'я, якщо автор виступав під псевдонімом. */
  realName?: string
  authorSlug?: string
}

export const AWARDS: Award[] = [
  { contest: 'Зірковий старт-2025', place: 1, name: 'Тетяна Біденко', authorSlug: 'tetiana-bidenko' },
  { contest: 'Зірковий старт-2025', place: 2, name: 'Aurelius Odel', realName: 'Вікторія Майстренко' },
  { contest: 'Зірковий старт-2025', place: 3, name: 'Сергій Шевченко' },
]

export const PLACE_LABEL: Record<Place, string> = { 1: 'І місце', 2: 'ІІ місце', 3: 'ІІІ місце' }

export function awardsForAuthor(slug: string): Award[] {
  return AWARDS.filter(a => a.authorSlug === slug)
}
