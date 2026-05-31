import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Стати автором — Balabony™',
  description:
    'Публікуй свої історії на Balabony і отримуй гонорар з кожного прочитання. Чесний розподіл доходу — обирай умови, що підходять саме тобі.',
  alternates: { canonical: '/become-author' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/become-author',
    title: 'Стати автором — Balabony™',
    description:
      'Публікуй свої історії на Balabony і отримуй гонорар з кожного прочитання.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
}

export default function BecomeAuthorLayout({ children }: { children: React.ReactNode }) {
  return children
}
