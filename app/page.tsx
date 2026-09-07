import HomeClient from './HomeClient'
import { getFairytales, getFreshStories, getHomeSeries, getTyshaItems } from '@/lib/home-data'

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
  const [seriesData, freshStories, fairytales, tyshaItems] = await Promise.all([
    getHomeSeries(3),
    getFreshStories(6),
    getFairytales(3),
    getTyshaItems(3),
  ])

  return (
    <HomeClient
      seriesData={seriesData}
      freshStories={freshStories}
      fairytales={fairytales}
      tyshaItems={tyshaItems}
    />
  )
}
