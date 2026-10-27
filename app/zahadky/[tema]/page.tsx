import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import { ThemeProvider } from '@/app/context/ThemeContext'
import { ZAHADKY_TOPICS, findZahadkyTopic } from '@/lib/zahadky'
import ZahadkyList from '../ZahadkyList'

export function generateStaticParams() {
  return ZAHADKY_TOPICS.map((t) => ({ tema: t.slug }))
}

// Лише ті теми, що є в lib/zahadky.ts; будь-яка інша адреса — 404.
export const dynamicParams = false

export async function generateMetadata(
  { params }: { params: Promise<{ tema: string }> },
): Promise<Metadata> {
  const { tema } = await params
  const t = findZahadkyTopic(tema)
  if (!t) return {}
  return {
    title: `${t.h1} | Балабони`,
    description: t.description,
    alternates: { canonical: `/zahadky/${t.slug}` },
    openGraph: {
      title: `${t.h1} | Балабони`,
      description: t.description,
      url: `https://balabony.com/zahadky/${t.slug}`,
      type: 'website',
    },
  }
}

export default async function ZahadkyTopicPage(
  { params }: { params: Promise<{ tema: string }> },
) {
  const { tema } = await params
  const t = findZahadkyTopic(tema)
  if (!t) notFound()

  const others = ZAHADKY_TOPICS.filter((x) => x.slug !== t.slug)

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: 'Загадки', href: '/zahadky' }, { label: t.name }]} />
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 30, margin: '0 0 8px', color: 'var(--accent-gold)' }}>
          {t.h1}
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: 17, lineHeight: 1.65, margin: '0 0 26px' }}>{t.intro}</p>

        <ZahadkyList items={t.items} />

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 22, margin: '0 0 12px', color: 'var(--accent-gold)' }}>
            Інші загадки
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/zahadky/${o.slug}`}
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#FAC775',
                  textDecoration: 'none',
                  border: '1px solid rgba(239,159,39,0.45)',
                  borderRadius: 22,
                  padding: '9px 16px',
                }}
              >
                {o.name}
              </Link>
            ))}
          </div>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, marginTop: 22 }}>
            Після загадок — <Link href="/fairytales" style={{ color: '#FAC775' }}>казка на ніч</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
