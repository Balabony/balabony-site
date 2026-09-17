import type { Metadata } from 'next'
import type { ReactNode } from 'react'

/**
 * Метадані для клієнтської сторінки гри (17.09.2026, аудит).
 *
 * Чотирнадцять ігор стояли в sitemap із заголовком головної — Google бачив
 * чотирнадцять сторінок з однією назвою. Клієнтський компонент `metadata`
 * експортувати не може, тому опис живе тут, у layout тієї самої папки.
 *
 * Назви й описи взяті з переліку в app/games/page.tsx, щоб текст у пошуку
 * збігався з тим, що людина бачить на сторінці ігор.
 */
export const metadata: Metadata = {
  title: 'Назви якнайбільше — гра на словесну побіжність | Балабони',
  description: 'Називайте якнайбільше слів на тему чи літеру за хвилину. Словесна побіжність — показник із психологічних обстежень.',
  alternates: { canonical: '/games/fluency' },
  openGraph: {
    title: 'Назви якнайбільше — гра на словесну побіжність | Балабони',
    description: 'Називайте якнайбільше слів на тему чи літеру за хвилину. Словесна побіжність — показник із психологічних обстежень.',
    url: 'https://balabony.com/games/fluency',
    type: 'website',
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
