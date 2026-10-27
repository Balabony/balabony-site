import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import { ThemeProvider } from '@/app/context/ThemeContext'
import { ZAHADKY_TOPICS, ZAHADKY_TOTAL } from '@/lib/zahadky'
import ZahadkyList from './ZahadkyList'

/* Розділ створено 27.10.2026. Планувальник ключових слів: «загадки» —
   40 500 запитів/міс, низька конкуренція. Заголовок під головний запит
   «загадки з відповідями», тематичні сторінки — під «загадки про зиму»,
   «загадки про тварин» тощо. */
export const metadata: Metadata = {
  title: 'Загадки для дітей з відповідями — народні українські загадки | Балабони',
  description:
    'Народні українські загадки з відповідями: про зиму, про тварин, для найменших і логічні. Відповідь відкривається одним натиском — зручно загадувати вголос.',
  alternates: { canonical: '/zahadky' },
  openGraph: {
    title: 'Загадки для дітей з відповідями | Балабони',
    description: 'Народні українські загадки з відповідями — про зиму, тварин, для найменших і на кмітливість.',
    url: 'https://balabony.com/zahadky',
    type: 'website',
  },
}

const H2: React.CSSProperties = {
  fontFamily: '"Comfortaa", sans-serif',
  fontSize: 24,
  margin: '0 0 14px',
  color: 'var(--accent-gold)',
}

export default function ZahadkyPage() {
  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: 'Загадки' }]} />
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, margin: '0 0 8px', color: 'var(--accent-gold)' }}>
          Загадки з відповідями
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: 17, lineHeight: 1.65, margin: '0 0 24px' }}>
          {ZAHADKY_TOTAL} народних українських загадок — для дітей і дорослих. Прочитайте загадку вголос,
          дайте час подумати, а тоді натисніть «Показати відповідь».
        </p>

        <nav aria-label="Теми загадок" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '0 0 36px' }}>
          {ZAHADKY_TOPICS.map((t) => (
            <Link
              key={t.slug}
              href={`/zahadky/${t.slug}`}
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
              {t.name} · {t.items.length}
            </Link>
          ))}
        </nav>

        {ZAHADKY_TOPICS.map((t) => (
          <section key={t.slug} style={{ marginBottom: 40 }}>
            <h2 style={H2}>Загадки {t.name.toLowerCase()}</h2>
            <ZahadkyList items={t.items.slice(0, 4)} />
            <p style={{ margin: '14px 0 0' }}>
              <Link href={`/zahadky/${t.slug}`} style={{ color: '#FAC775', fontSize: 16, fontWeight: 600 }}>
                Усі {t.items.length} загадок — «{t.name}» →
              </Link>
            </p>
          </section>
        ))}

        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>
          Шукаєте, що почитати дитині після загадок?{' '}
          <Link href="/fairytales" style={{ color: '#FAC775' }}>Казки на ніч</Link>
          {' '}— безкоштовно, українською.
        </p>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
