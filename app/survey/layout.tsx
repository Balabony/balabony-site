import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Опитування — Balabony™',
  description:
    'Поділіться думкою про Balabony: які жанри й історії вам найцікавіші. Ваші відповіді допомагають нам створювати кращий український контент для всієї родини.',
  alternates: { canonical: '/survey' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/survey',
    title: 'Опитування — Balabony™',
    description:
      'Поділіться думкою про Balabony: які жанри й історії вам найцікавіші.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
}

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return children
}
