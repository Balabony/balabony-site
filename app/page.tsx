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
export const revalidate = 10800

export default async function HomePage() {
  const [seriesData, freshStories, fairytales, tyshaItems, genreCounts, stats, authors] =
    await Promise.all([
    // Баланс головної, рішення 09.09.2026: серіали автора платформи забирали
    // більшу частину екрана — три великі картки «Балабонів» плюс три «Тиші»
    // проти шести дрібних карток творів п'ятдесяти авторів. Серіалів по дві,
    // історій дев'ять: місце віддано тим, хто пише для платформи.
    getHomeSeries(2),
    getFreshStories(9),
    getFairytales(3),
    getTyshaItems(2),
    getGenreCounts(),
    getSiteStats(),
    getStripAuthors(8),
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
      />
    </>
  )
}
