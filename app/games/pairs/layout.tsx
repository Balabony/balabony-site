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
  title: 'Знайди пару — гра на зорову пам’ять | Балабони',
  description: 'Тренує зорову пам’ять. Приємно грати разом із дітьми чи онуками. Безкоштовно, без реєстрації.',
  alternates: { canonical: '/games/pairs' },
  openGraph: {
    title: 'Знайди пару — гра на зорову пам’ять | Балабони',
    description: 'Тренує зорову пам’ять. Приємно грати разом із дітьми чи онуками. Безкоштовно, без реєстрації.',
    url: 'https://balabony.com/games/pairs',
    type: 'website',
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
