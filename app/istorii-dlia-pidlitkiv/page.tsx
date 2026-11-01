import type { Metadata } from 'next'
import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import type { Story } from '../components/FreshStoriesGrid'
import StoriesPaged from '../components/StoriesPaged'
import Breadcrumbs from '../components/Breadcrumbs'
import { toExcerpt } from '@/lib/plain-text'

/**
 * 01.11.2026: добірка для підлітків — /istorii-dlia-pidlitkiv.
 * Запит «книги для підлітків» ~1 900 пошуків на місяць (планувальник Google Ads).
 * Головне — серіал «Балабони» (гумор, родина, дід і баба). Далі ручний список
 * окремих історій: народна містика, студентський гумор. Цикли частинами сюди
 * не беремо — підліток відкриє 7-му частину й не зрозуміє, з чого почати.
 * «Тиша» має позначку 18+, тому тут її немає.
 */

export const revalidate = 900

const SLUGS = [
  'chy-isnuie-zhyttia-v-studentskomu-hurtozhytku',
  'chi-prihodit-svyatij-mikolaj-do-studentiv',
  'u-stolytsiu',
  'knizhkovij-vampir',
  'domovichok',
  'shulikunchiki',
  'bila-panna',
  'selo-de-nemaie-vidom',
  'vidma-z-okrayini',
  'davnia-kazka',
  'kishka-irisi',
  'cherevichki-dlya-dvoh-sester',
  'shlyah-dodomu546',
  'v-yazka-klyuchiv',
  'znaki-nespokoyu',
  'ya-bachu',
  'ne-toi-avtobus-abo-ne-pospishai-zhyty',
]

const TITLE = 'Історії для підлітків українською'
const DESCRIPTION =
  'Що почитати підлітку українською: серіал «Балабони» — гумор, родина, дід і баба, а також містичні й смішні історії сучасних українських авторів. Онлайн, безкоштовно, з телефона.'

export const metadata: Metadata = {
  title: `${TITLE} — читати онлайн безкоштовно | Балабони`,
  description: DESCRIPTION,
  alternates: { canonical: '/istorii-dlia-pidlitkiv' },
  openGraph: {
    title: `${TITLE} — Балабони`,
    description: DESCRIPTION,
    url: 'https://balabony.com/istorii-dlia-pidlitkiv',
    type: 'website',
  },
}

interface Row {
  slug: string
  title: string
  author_name: string
  genre: string | null
  preview_text: string | null
  cover_url: string | null
  cover_position: string | null
  duration_minutes: number | null
  category: string | null
  is_adult: boolean | null
}

async function getStories(): Promise<Story[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, author_name, genre, preview_text, cover_url, cover_position, duration_minutes, category, is_adult')
    .eq('type', 'story')
    .in('status', ['approved', 'published'])
    .in('slug', SLUGS)
  if (error || !data) return []
  const rows = (data as Row[]).filter((r) => !r.is_adult)
  rows.sort((a, b) => SLUGS.indexOf(a.slug) - SLUGS.indexOf(b.slug))
  return rows.map((s) => ({
    id: s.slug,
    title: s.title,
    author: s.author_name,
    coverUrl: s.cover_url ?? '/og-image.jpg',
    coverPosition: s.cover_position ?? undefined,
    tags: [],
    hasAudio: false,
    teaser: toExcerpt(s.preview_text, 200),
    url: `/stories/${s.slug}`,
    genre: s.genre ?? undefined,
    duration_minutes: s.duration_minutes ?? undefined,
    category: s.category ?? undefined,
    isAdult: false,
  }))
}

const GOLD = '#ef9f27'
const FONT = "'Montserrat', sans-serif"

export default async function TeenPage() {
  const stories = await getStories()
  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: 'Історії', href: '/stories' }, { label: 'Для підлітків' }]} />

        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 8, color: 'var(--accent-gold)' }}>
          {TITLE}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, margin: '0 0 28px', fontFamily: FONT, maxWidth: 680, lineHeight: 1.6 }}>
          Що почитати підлітку українською, коли шкільна програма вже прочитана? Короткі історії на 10–20 хвилин —
          з телефона, онлайн і безкоштовно. Без реєстрації.
        </p>

        <section
          aria-labelledby="serial-balabony"
          style={{ border: `1px solid ${GOLD}`, borderRadius: 16, padding: '22px 24px', margin: '0 0 36px', background: 'rgba(239,159,39,0.08)' }}
        >
          <h2 id="serial-balabony" style={{ fontFamily: FONT, fontSize: 22, margin: '0 0 8px', color: '#fff' }}>
            Серіал «Балабони»
          </h2>
          <p style={{ fontFamily: FONT, fontSize: 16, color: '#cbd5e1', margin: '0 0 16px', lineHeight: 1.6, maxWidth: 680 }}>
            Гумор, родина, дід і баба. Серії по 10 хвилин — можна читати по одній на перерві або перед сном.
            Перші серії кожного сезону безкоштовні.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link href="/episodes/s1e01" style={{ background: GOLD, color: '#0a1628', fontWeight: 800, padding: '12px 20px', borderRadius: 24, textDecoration: 'none', fontFamily: FONT }}>
              Почати з першої серії
            </Link>
            <Link href="/episodes" style={{ border: `1px solid ${GOLD}`, color: '#fac775', fontWeight: 700, padding: '12px 20px', borderRadius: 24, textDecoration: 'none', fontFamily: FONT }}>
              Усі серії
            </Link>
          </div>
        </section>

        <h2 style={{ fontFamily: FONT, fontSize: 22, margin: '0 0 16px', color: '#fff' }}>
          Містика й гумор: окремі історії
        </h2>
        {stories.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Добірка оновлюється.</p>
        ) : (
          <StoriesPaged stories={stories} />
        )}
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
