import type { Metadata } from 'next'
import FreeHero from '../components/FreeHero'
import HowItWorks from '../components/HowItWorks'
import FAQ from '../components/FAQ'

export const metadata: Metadata = {
  title: 'Спробуй безкоштовно — Balabony',
  description:
    'Вісім серій + сім історій + тиждень повного доступу. Спробуй, перш ніж щось купувати.',
  openGraph: {
    title: 'Спробуй безкоштовно — Balabony',
    description:
      'Вісім серій + сім історій + тиждень повного доступу. Без картки.',
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
