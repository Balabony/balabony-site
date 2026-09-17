import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Доступність — Balabony™',
  description:
    'Як читати Balabony, якщо звичайний сайт читати важко: збільшення шрифту до 200%, режим дислексії, високий контраст, підтримка скрінрідерів. Пільговий доступ 1 ₴ на рік для ветеранів, людей з інвалідністю та ВПО.',
  alternates: { canonical: '/accessibility' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/accessibility',
    title: 'Доступність — Balabony™',
    description:
      'Збільшення шрифту, режим дислексії, високий контраст, підтримка скрінрідерів. Пільга 1 ₴ на рік для ветеранів, людей з інвалідністю та ВПО.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
}

export default function AccessibilityLayout({ children }: { children: React.ReactNode }) {
  return children
}
