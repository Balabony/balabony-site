import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Підтримати — Balabony™',
  description:
    'Підтримайте Balabony — українську платформу історій із безкоштовним і пільговим доступом для незрячих, ветеранів та ВПО. Дізнайтеся, на що підуть кошти, і зробіть свій внесок.',
  alternates: { canonical: '/support' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/support',
    title: 'Підтримати — Balabony™',
    description:
      'Підтримайте українську платформу історій Balabony з безкоштовним і пільговим доступом для тих, хто цього потребує.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}
