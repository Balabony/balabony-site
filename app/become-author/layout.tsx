import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Стати автором — Balabony™',
  description:
    'Публікуйте свої історії на Balabony й отримуйте винагороду за кожне прочитання. Чесний розподіл доходу — обирайте умови, що підходять саме вам.',
  alternates: { canonical: '/become-author' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/become-author',
    title: 'Стати автором — Balabony™',
    description:
      'Публікуйте свої історії на Balabony й отримуйте винагороду за кожне прочитання.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
}

export default function BecomeAuthorLayout({ children }: { children: React.ReactNode }) {
  return children
}
