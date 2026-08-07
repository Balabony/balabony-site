/**
 * Транслітерація імені автора в URL-slug.
 *
 * Окремої колонки slug у author_profiles свідомо немає: імена рідко
 * змінюються, а зайва колонка потребувала б синхронізації при кожному
 * перейменуванні. Замість цього slug рахується з display_name на льоту
 * і порівнюється з тим, що прийшов у URL.
 *
 * Стандарт — офіційна українська транслітерація (постанова КМУ №55),
 * та сама, що в закордонних паспортах: Оксана Кришталева → oksana-kryshtaleva.
 */

const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie',
  ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ю: 'iu', я: 'ia',
}

/** Сполуки, що транслітеруються інакше на початку слова. */
const WORD_START: Record<string, string> = {
  є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya',
}

/** «зг» передається як «zgh», щоб відрізнити від «ж» (zh). */
function fixZgh(input: string): string {
  return input.replace(/зг/g, 'zgh').replace(/ЗГ/g, 'zgh')
}

export function authorSlug(name: string): string {
  if (!name) return ''

  const words = fixZgh(name.trim().toLowerCase())
    .replace(/['’ʼ`]/g, '')
    .split(/[\s\-—–]+/)
    .filter(Boolean)

  const out = words.map((word) => {
    let res = ''
    for (let i = 0; i < word.length; i++) {
      const ch = word[i]
      if (i === 0 && WORD_START[ch] !== undefined) {
        res += WORD_START[ch]
      } else if (MAP[ch] !== undefined) {
        res += MAP[ch]
      } else if (/[a-z0-9]/.test(ch)) {
        res += ch
      }
      // усе інше (розділові, дужки, цифри в дужках) відкидаємо
    }
    return res
  })

  return out.filter(Boolean).join('-')
}
