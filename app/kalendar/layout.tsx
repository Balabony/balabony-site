import type { Metadata } from 'next'

/**
 * Метадані для /kalendar.
 *
 * Окремий layout потрібен тому, що сама сторінка — клієнтський компонент
 * (гортання знімків і форма замовлення), а клієнтський компонент не може
 * експортувати metadata. До 12.09.2026 сторінка не мала ні титулу, ні
 * опису взагалі: у видачі показувався загальний титул сайту.
 *
 * Ключові слова тут інші, ніж на /kalendar-2027. Там «роздрукувати
 * безкоштовно», тут «купити настінний А3». Дві сторінки навмисно розведені
 * за наміром пошуку, щоб не конкурувати між собою.
 */

const TITLE = 'Календар-планувальник 2027 А3 купити — Балабони'
const DESC  = 'Настінний календар-планувальник на 2027 рік від Балабонів: формат А3, 15 сторінок на пружині, поле для нотаток на кожен місяць. 550 грн від виробника.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://balabony.com/kalendar' },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: 'https://balabony.com/kalendar',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
    images: ['https://balabony.com/kalendar/sichen.webp'],
  },
}

export default function KalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
