import type { Metadata } from 'next'
import AboutAuthorSection from '@/app/components/AboutAuthorSection'
import Breadcrumbs from '@/app/components/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Про автора — Балабони',
  description: 'Назар Колодій — український письменник зі Львова, автор серій «Балабони».',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>
      <Breadcrumbs items={[{ label: 'Про автора' }]} />
      <AboutAuthorSection />
    </main>
  )
}
