// FILE: app/games/layout.tsx
// 10.09.2026: заголовок і опис розділу відставали від самої сторінки —
// вона давно називається «Ігри для мозку» і починається з вправ на памʼять
// та увагу, а метадані перелічували першими шахи й шашки. Опис приведено
// до фактичного набору: спершу вправи, потім класичні настільні ігри.
// Метадані винесено в layout, бо сама сторінка — клієнтський компонент
// ('use client'), а в такому не можна експортувати metadata. Без цього
// файлу сторінка успадковувала заголовок і опис головної, і в Google
// вони дублювалися на десятках адрес.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ігри для мозку — вправи на памʼять і увагу · Balabony',
  description:
    'Безкоштовні вправи на памʼять, увагу та швидкість сприйняття — частина за зразком дослідження ACTIVE. Плюс шахи, шашки, доміно, судоку й нарди. Без реєстрації, просто в браузері.',
  alternates: { canonical: 'https://balabony.com/games' },
  openGraph: {
    title: 'Ігри для мозку — вправи на памʼять і увагу · Balabony',
    description: 'Безкоштовні вправи на памʼять, увагу та швидкість сприйняття — частина за зразком дослідження ACTIVE. Плюс шахи, шашки, доміно, судоку й нарди. Без реєстрації, просто в браузері.',
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
