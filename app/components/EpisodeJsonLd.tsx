/**
 * Структуровані дані (schema.org) для сторінки СЕРІЇ.
 *
 * Навіщо: на /stories/[id] і /avtor/[slug] розмітка вже була, а 205 сторінок
 * обох серіалів («Балабони» + «Тиша») віддавали пошуковику голий текст без
 * жодної ознаки, що це твір, чий він і до якого циклу належить.
 *
 * Чому окремий компонент, а не копія в кожній сторінці: сторінки серій
 * різні (різні назви полів, різні правила доступу), але розмітка в них
 * мусить бути ОДНАКОВОЮ. Дві копії розійшлися б з першою ж правкою.
 *
 * isPartOf прив'язує серію до циклу — саме цей зв'язок дає пошуковику
 * зрозуміти, що сто сторінок це один твір, а не сто розрізнених текстів.
 *
 * isAccessibleForFree + hasPart описують пейвол чесно: замкнена серія
 * показує тізер, і ми прямо кажемо, яка частина сторінки платна. Google
 * вимагає саме такої розмітки, інакше показ тізера ботові й людині
 * трактується як маскування (cloaking).
 */

type Props = {
  title: string
  /** Повний шлях сторінки без домену, напр. /episodes/s1e05 */
  path: string
  /** Назва циклу: «Балабони» або «Тиша» */
  seriesName: string
  /** Адреса головної сторінки циклу без домену, напр. /episodes */
  seriesPath: string
  /** Наскрізний номер серії в циклі */
  position?: number | null
  coverUrl?: string | null
  datePublished?: string | null
  /** true — серія відкрита; false — під пейволом */
  isFree: boolean
  /** CSS-селектор платної частини тексту на цій сторінці */
  paidSelector: string
}

const BASE = 'https://balabony.com'

// Обидва серіали записані в базі під цим ім'ям, і сторінка автора існує.
// Тримаємо константою, щоб не тягнути зайве поле в select на сторінках,
// які й так роблять кілька запитів до бази.
const AUTHOR_NAME = 'Назар Колодій'
const AUTHOR_PATH = '/avtor/nazar-kolodii'

export default function EpisodeJsonLd({
  title,
  path,
  seriesName,
  seriesPath,
  position,
  coverUrl,
  datePublished,
  isFree,
  paidSelector,
}: Props) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    author: {
      '@type': 'Person',
      name: AUTHOR_NAME,
      url: `${BASE}${AUTHOR_PATH}`,
    },
    isPartOf: {
      '@type': 'CreativeWorkSeries',
      name: seriesName,
      url: `${BASE}${seriesPath}`,
    },
    ...(typeof position === 'number' && position > 0 ? { position } : {}),
    ...(datePublished ? { datePublished } : {}),
    inLanguage: 'uk-UA',
    ...(coverUrl ? { image: [coverUrl] } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Balabony',
      url: BASE,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE}/icon-512.png`,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE}${path}`,
    },
    isAccessibleForFree: isFree,
    ...(isFree
      ? {}
      : {
          hasPart: {
            '@type': 'WebPageElement',
            isAccessibleForFree: false,
            cssSelector: paidSelector,
          },
        }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
