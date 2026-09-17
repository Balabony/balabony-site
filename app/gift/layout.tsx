import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Подарувати підписку — Balabony™',
  description:
    'Подаруйте близьким доступ до українських історій Balabony. Оформіть подарункову підписку за кілька хвилин — код активації надійде на пошту отримувача.',
  alternates: { canonical: '/gift' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/gift',
    title: 'Подарувати підписку — Balabony™',
    description:
      'Подаруйте близьким доступ до українських історій Balabony. Код активації надійде на пошту отримувача.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
}

export default function GiftLayout({ children }: { children: React.ReactNode }) {
  return children
}
