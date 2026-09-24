import HomeClient from './HomeClient'
import HomeJsonLd from './components/HomeJsonLd'
import {
  getFairytales,
  getFreshStories,
  getGenreCounts,
  getHomeSeries,
  getSiteStats,
  getStripAuthors,
  getTyshaItems,
} from '@/lib/home-data'
import { getMostFinished } from '@/lib/most-finished'

/**
 * Головна тепер збирається на сервері.
 *
 * Раніше сторінка була клієнтською і тягнула серії та історії fetch'ем уже в
 * браузері — пошуковик отримував порожню оболонку без жодної назви. Тепер
 * дані приходять у HTML, а весь інтерактив лишається в HomeClient.
 *
 * Термін оновлення дорівнює кроку ротації вітрини (3 години): частіше
 * перебудовувати нема сенсу, набір однаково той самий.
 */
// Кеш головної. Мусить збігатися з кроком ротації (ROTATION_STEP_MS у
// lib/home-data.ts) і з s-maxage у /api/stories: довший кеш з'їдає ротацію,
// бо читач отримує стару сторінку. 16.09.2026 усі три зменшено до години.
export const revalidate = 3600

export default async function HomePage() {
  const [seriesData, freshStories, fairytales, tyshaItems, genreCounts, stats, authors, mostFinished] =
    await Promise.all([
    // Баланс головної, рішення 09.09.2026: серіали автора платформи забирали
    // більшу частину екрана — три великі картки «Балабонів» плюс три «Тиші»
    // проти шести дрібних карток творів п'ятдесяти авторів. Серіалів по дві,
    // історій дев'ять: місце віддано тим, хто пише для платформи.
    // Одна картка, не дві: серіал читається з початку, а дві картки поруч
    // пропонують вибір, у якого правильна відповідь лише одна — перша серія.
    // Решта під рукою через «Усі серії →».
    getHomeSeries(1),
    getFreshStories(9),
    getFairytales(3),
    // Одна серія, не дві: обкладинка в «Тиші» одна на весь серіал, тож дві
    // картки поруч відрізнялися лише чотирма словами тизера й читалися як
    // збій завантаження. Друга картка вела в серію 2 — той, хто вже читає,
    // повертається через «Продовжити читання», а не звідси.
    getTyshaItems(1),
    getGenreCounts(),
    getSiteStats(),
    getStripAuthors(8),
    // 24.09.2026: «Найбільше дочитують» — лише окремі історії, як на /top:
    // серіали мають системну перевагу й забрали б увесь список.
    getMostFinished(10, { storiesOnly: true }),
  ])

  return (
    <>
      <HomeJsonLd />
      <HomeClient
        seriesData={seriesData}
        freshStories={freshStories}
        fairytales={fairytales}
        tyshaItems={tyshaItems}
        genreCounts={genreCounts}
        stats={stats}
        authors={authors}
        mostFinished={mostFinished}
      />
    </>
  )
}
