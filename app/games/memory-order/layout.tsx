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
  title: 'Запам’ятай порядок — гра на пам’ять | Балабони',
  description: 'Тренує робочу пам’ять. Кілька коротких занять на тиждень дають помітний результат.',
  alternates: { canonical: '/games/memory-order' },
  openGraph: {
    title: 'Запам’ятай порядок — гра на пам’ять | Балабони',
    description: 'Тренує робочу пам’ять. Кілька коротких занять на тиждень дають помітний результат.',
    url: 'https://balabony.com/games/memory-order',
    type: 'website',
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
