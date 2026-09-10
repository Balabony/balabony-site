// FILE: app/games/layout.tsx
// Метадані винесено в layout, бо сама сторінка — клієнтський компонент
// ('use client'), а в такому не можна експортувати metadata. Без цього
// файлу сторінка успадковувала заголовок і опис головної, і в Google
// вони дублювалися на десятках адрес.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ігри Клубу довголіття — Balabony',
  description:
    'Безкоштовні вправи для тренування памʼяті, уваги й реакції: шахи, шашки, нарди, доміно, судоку та вісім вправ на памʼять.',
  alternates: { canonical: 'https://balabony.com/games' },
  openGraph: {
    title: 'Ігри Клубу довголіття — Balabony',
    description: 'Безкоштовні вправи для тренування памʼяті, уваги й реакції: шахи, шашки, нарди, доміно, судоку та вісім вправ на памʼять.',
    url: 'https://balabony.com/games',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
    images: [{ url: 'https://balabony.com/og-image-v4.jpg', width: 1200, height: 630 }],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
