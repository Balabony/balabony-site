import type { Metadata } from 'next'
import FreeHero from '../components/FreeHero'
import HowItWorks from '../components/HowItWorks'
import FAQ from '../components/FAQ'

export const metadata: Metadata = {
  // 01.11.2026: власний canonical — без нього сторінка брала '/' з layout і Google вважав її копією головної.
  alternates: { canonical: '/free' },
  title: 'Спробуй безкоштовно — Balabony',
  description:
    'Понад 1000 історій і 24 серії. Спробуй, перш ніж щось купувати.',
  openGraph: {
    title: 'Спробуй безкоштовно — Balabony',
    description:
      'Понад 1000 історій і 24 серії. Без картки.',
    url: 'https://balabony.com/free',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
  },
}

export default function FreePage() {
  return (
    <main>
      <FreeHero ctaHref="/episodes" />
      <HowItWorks />
      <FAQ />
    </main>
  )
}
