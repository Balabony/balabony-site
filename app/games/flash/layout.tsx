// FILE: app/games/flash/layout.tsx
// Метадані винесено в layout, бо сама сторінка — клієнтський компонент
// ('use client'), а в такому не можна експортувати metadata. Без цього
// файлу сторінка успадковувала заголовок і опис головної, і в Google
// вони дублювалися на десятках адрес.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Спалах — ігри Клубу довголіття · Balabony',
  description:
    'Вправа на швидкість зорового сприйняття. Безкоштовна вправа на платформі Балабони — без реєстрації, просто в браузері.',
  alternates: { canonical: 'https://balabony.com/games/flash' },
  openGraph: {
    title: 'Спалах — ігри Клубу довголіття · Balabony',
    description: 'Вправа на швидкість зорового сприйняття. Безкоштовна вправа на платформі Балабони — без реєстрації, просто в браузері.',
    url: 'https://balabony.com/games/flash',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
    images: [{ url: 'https://balabony.com/og-image-v4.jpg', width: 1200, height: 630 }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
