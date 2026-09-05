import type { Metadata } from 'next'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FAQ from '../components/FAQ'

export const metadata: Metadata = {
  title: 'Часті питання — Balabony',
  description:
    'Відповіді на питання про Балабони: безкоштовний доступ, реєстрація, тарифи, пільговий тариф, подарунки та співпраця з авторами.',
  openGraph: {
    title: 'Часті питання — Balabony',
    description: 'Усе, що варто знати про Балабони: доступ, тарифи, пільги та авторство.',
    url: 'https://balabony.com/faq',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
  },
}

export default function FaqPage() {
  return (
    <>
      <Header />
      <main style={{ background: 'var(--dark)', padding: '28px 5% 40px' }}>
        <FAQ />
      </main>
      <Footer />
    </>
  )
}
