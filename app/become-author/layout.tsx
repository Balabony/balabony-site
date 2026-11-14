import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Стати автором — Balabony™',
  description:
    'Публікуйте свої історії на Balabony: наразі це безкоштовна платформа, виплат авторам поки немає. Після переходу до платної моделі винагорода визначатиметься авторським договором.',
  alternates: { canonical: '/become-author' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/become-author',
    title: 'Стати автором — Balabony™',
    description:
      'Публікуйте свої історії на безкоштовній платформі аудіоісторій Balabony.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
}

export default function BecomeAuthorLayout({ children }: { children: React.ReactNode }) {
  return children
}
