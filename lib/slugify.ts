/**
 * Транслітерація заголовка в slug.
 *
 * Функція жила всередині `app/api/admin/import-archive/route.ts`. Коли автор
 * дістав змогу додавати твори сам (09.09.2026), знадобилася та сама логіка —
 * а дві копії неминуче розійшлися б, і однаковий заголовок дав би різні
 * адреси залежно від того, хто завів твір.
 */

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
  и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ь: '', ю: 'iu', я: 'ia', "'": '', '’': '',
}

export function slugify(s: string): string {
  const out = s.toLowerCase().split('').map(ch => TRANSLIT[ch] ?? ch).join('')
  return out.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'istoriia'
}
