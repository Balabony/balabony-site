import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import { ThemeProvider } from '@/app/context/ThemeContext'
import { SKOROMOVKY_GROUPS, SKOROMOVKY_TOTAL } from '@/lib/skoromovky'

/* Розділ створено 27.10.2026. «скоромовки» — 9 900 запитів/міс
   (Планувальник ключових слів). Аудиторія: батьки, логопеди, вчителі,
   а також 55+ — скоромовки тренують мовлення так само, як ігри «Клубу
   довголіття» тренують пам'ять. */
export const metadata: Metadata = {
  title: 'Скоромовки українською для дітей і дорослих — для розвитку мовлення | Балабони',
  description:
    'Українські скоромовки для дітей і дорослих: короткі й довші, для розвитку мовлення, дикції й вимови. Як тренуватися — поради від редакції Балабонів.',
  alternates: { canonical: '/skoromovky' },
  openGraph: {
    title: 'Скоромовки українською для дітей і дорослих | Балабони',
    description: 'Короткі й довші українські скоромовки для розвитку мовлення та дикції.',
    url: 'https://balabony.com/skoromovky',
    type: 'website',
  },
}

const TIPS: string[] = [
  'Спершу прочитайте скоромовку повільно й чітко, по складах.',
  'Повторіть тричі поспіль у звичайному темпі — без запинок.',
  'Лише тоді пришвидшуйтеся. Швидкість без чіткості нічого не тренує.',
  'Дитині покажіть, як рухаються губи й язик, — і проговорюйте разом.',
  'Дорослим скоромовки допомагають розім’яти мовлення зранку чи перед виступом.',
]

export default function SkoromovkyPage() {
  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: 'Скоромовки' }]} />
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, margin: '0 0 8px', color: 'var(--accent-gold)' }}>
          Скоромовки українською
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: 17, lineHeight: 1.65, margin: '0 0 26px' }}>
          {SKOROMOVKY_TOTAL} скоромовок для дітей і дорослих — для розвитку мовлення, дикції та гарного настрою.
          Спробуйте промовити швидко й не запнутися.
        </p>

        <section
          aria-labelledby="yak-trenuvatysia"
          style={{
            background: 'rgba(239,159,39,0.08)',
            border: '1px solid rgba(239,159,39,0.4)',
            borderRadius: 14,
            padding: '18px 20px',
            margin: '0 0 36px',
          }}
        >
          <h2 id="yak-trenuvatysia" style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 20, margin: '0 0 10px', color: 'var(--accent-gold)' }}>
            Як тренуватися
          </h2>
          <ol style={{ margin: 0, paddingLeft: 22, color: '#e2e8f0', fontSize: 16, lineHeight: 1.7 }}>
            {TIPS.map((t) => <li key={t}>{t}</li>)}
          </ol>
        </section>

        {SKOROMOVKY_GROUPS.map((g) => (
          <section key={g.id} id={g.id} style={{ marginBottom: 40, scrollMarginTop: 90 }}>
            <h2 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 24, margin: '0 0 6px', color: 'var(--accent-gold)' }}>
              {g.title}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 0 16px' }}>{g.note}</p>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
              {g.items.map((it, i) => (
                <li
                  key={i}
                  style={{
                    background: '#0f1e3a',
                    border: '1px solid rgba(143,163,196,0.22)',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <span aria-hidden="true" style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: 18, minWidth: 26 }}>
                    {i + 1}.
                  </span>
                  <p style={{ margin: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 20, lineHeight: 1.55, color: '#f5f0e8' }}>
                    {it.lines.map((l, k) => (
                      <span key={k} style={{ display: 'block' }}>{l}</span>
                    ))}
                    {it.author && (
                      <span style={{ display: 'block', marginTop: 6, fontSize: 13, color: '#8899bb', fontFamily: 'inherit' }}>
                        Автор: {it.author}
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6 }}>
          Ще для гри з дитиною: <Link href="/zahadky" style={{ color: '#FAC775' }}>загадки з відповідями</Link> і{' '}
          <Link href="/fairytales" style={{ color: '#FAC775' }}>казки на ніч</Link>.
        </p>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
