import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Доступність — Balabony™',
  description:
    'Рівний доступ до української літератури: аудіоверсії серій, підтримка дислексії, високий контраст і стандарти WCAG. Безкоштовний та пільговий доступ для незрячих, слабозорих, людей з інвалідністю, ветеранів і ВПО.',
  alternates: { canonical: '/accessibility' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/accessibility',
    title: 'Доступність — Balabony™',
    description:
      'Рівний доступ до української літератури: аудіо, підтримка дислексії, високий контраст, стандарти WCAG.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
}

export default function AccessibilityLayout({ children }: { children: React.ReactNode }) {
  return children
}
