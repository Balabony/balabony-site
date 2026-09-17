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
  title: 'Довгі нарди онлайн проти комп’ютера — безкоштовно | Балабони',
  description: 'Класичні довгі нарди проти комп’ютера, три рівні. Проведіть 15 шашок додому й винесіть першими.',
  alternates: { canonical: '/games/narde' },
  openGraph: {
    title: 'Довгі нарди онлайн проти комп’ютера — безкоштовно | Балабони',
    description: 'Класичні довгі нарди проти комп’ютера, три рівні. Проведіть 15 шашок додому й винесіть першими.',
    url: 'https://balabony.com/games/narde',
    type: 'website',
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
