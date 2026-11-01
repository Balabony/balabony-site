// 01.11.2026: тематична добірка казок на ніч (/fairytales/korotki, /pro-tvaryn, /zymovi).
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import AudioPlayer from '../../components/AudioPlayer'
import { ThemeProvider } from '../../context/ThemeContext'
import FreshStoriesGrid, { type Story } from '../../components/FreshStoriesGrid'
import Breadcrumbs from '../../components/Breadcrumbs'
import { toExcerpt } from '@/lib/plain-text'
import { pickPublishedText } from '@/lib/published-text'
import { KAZKY_TEMY, findKazkyTema } from '@/lib/kazky-temy'
import TemyNav from '../TemyNav'

export const revalidate = 3600

export function generateStaticParams() {
  return KAZKY_TEMY.map((t) => ({ tema: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ tema: string }> }): Promise<Metadata> {
  const t = findKazkyTema((await params).tema)
  if (!t) return {}
  const url = `https://balabony.com/fairytales/${t.slug}`
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: `/fairytales/${t.slug}` },
    openGraph: { images: ['https://balabony.com/og-image-v6.jpg'], title: t.title, description: t.description, url, type: 'website' },
  }
}

interface Row {
  slug: string; title: string; author_name: string; genre: string | null; text: string
  corrected_text: string | null; humanized_text: string | null; published_version: string | null
  cover_url: string | null; is_adult: boolean | null
}

async function getStories(slugs: string[]): Promise<Story[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('content')
    .select('slug, title, author_name, genre, text, corrected_text, humanized_text, published_version, cover_url, is_adult')
    .eq('type', 'story')
    .in('slug', slugs)
    .in('status', ['approved', 'published'])
  if (error || !data) return []
  const rows = (data as Row[]).sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug))
  return rows.map((s) => ({
    id: s.slug,
    title: s.title,
    author: s.author_name,
    coverUrl: s.cover_url ?? '/og-image.jpg',
    tags: [],
    hasAudio: false,
    teaser: toExcerpt(pickPublishedText(s), 200),
    url: `/stories/${s.slug}`,
    genre: s.genre ?? undefined,
    isAdult: s.is_adult ?? false,
  }))
}

const H2 = { fontFamily: '"Comfortaa", sans-serif', fontSize: 24, margin: '40px 0 12px', color: 'var(--accent-gold)' } as const
const P = { color: '#cbd5e1', fontSize: 16, lineHeight: 1.7, margin: '0 0 12px', maxWidth: 760 } as const

export default async function KazkyTemaPage({ params }: { params: Promise<{ tema: string }> }) {
  const t = findKazkyTema((await params).tema)
  if (!t) notFound()
  const stories = await getStories(t.slugs)
  const url = `https://balabony.com/fairytales/${t.slug}`
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Балабони', item: 'https://balabony.com/' },
        { '@type': 'ListItem', position: 2, name: 'Казки на ніч', item: 'https://balabony.com/fairytales' },
        { '@type': 'ListItem', position: 3, name: t.h1, item: url },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'ItemList', name: t.h1,
      itemListElement: stories.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.title, url: `https://balabony.com${s.url}` })),
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: t.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <Breadcrumbs items={[{ label: 'Казки на ніч', href: '/fairytales' }, { label: t.h1 }]} />
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 8, color: 'var(--accent-gold)' }}>{t.h1}</h1>
        <p style={{ ...P, color: '#94a3b8', margin: '0 0 20px' }}>{t.intro}</p>
        <TemyNav active={t.slug} />

        {stories.length === 0 ? <p style={{ color: '#94a3b8' }}>Казки скоро з’являться.</p> : <FreshStoriesGrid stories={stories} />}

        <h2 style={H2}>Як читати казку на ніч</h2>
        <ul style={{ ...P, paddingLeft: 22 }}>
          {t.tips.map((x) => <li key={x} style={{ marginBottom: 6 }}>{x}</li>)}
        </ul>

        <h2 style={H2}>Питання й відповіді</h2>
        {t.faq.map((f) => (
          <div key={f.q} style={{ margin: '0 0 14px', maxWidth: 760 }}>
            <h3 style={{ fontSize: 18, color: '#f1f5f9', margin: '0 0 4px' }}>{f.q}</h3>
            <p style={P}>{f.a}</p>
          </div>
        ))}

        <p style={{ ...P, marginTop: 32 }}>
          Ще для дитини:{' '}
          <Link href="/kvesty" style={{ color: '#FAC775' }}>квести з дипломом</Link>
          {' · '}
          <Link href="/zahadky" style={{ color: '#FAC775' }}>загадки з відповідями</Link>
          {' · '}
          <Link href="/skoromovky" style={{ color: '#FAC775' }}>скоромовки</Link>
          {' · '}
          <Link href="/konkurs-skoromovok" style={{ color: '#FAC775' }}>конкурс скоромовок для дітей</Link>
        </p>
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
