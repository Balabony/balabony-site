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
        {/* Сторінка не мала h1: компонент FAQ починається з h2, бо він же
            стоїть секцією на /free, і другий h1 там був би помилкою.
            Тому заголовок першого рівня належить саме сторінці. */}
        <h1 style={{
          maxWidth: 900, margin: '0 auto 18px', fontSize: 'clamp(26px, 5vw, 34px)',
          fontWeight: 700, color: 'var(--accent-gold)', textAlign: 'center',
        }}>
          Часті питання
        </h1>
        <FAQ />
      </main>
      <Footer />
    </>
  )
}
