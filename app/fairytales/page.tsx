import type { Metadata } from 'next'
import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AudioPlayer from '../components/AudioPlayer'
import { ThemeProvider } from '../context/ThemeContext'
import FreshStoriesGrid, { type Story } from '../components/FreshStoriesGrid'
import Breadcrumbs from '../components/Breadcrumbs'
import { toExcerpt } from '@/lib/plain-text'
import { pickPublishedText } from '@/lib/published-text'
import TemyNav from './TemyNav'

// 01.11.2026: питання для FAQ (видно на сторінці й у розмітці для Google).
const FAQ = [
  { q: 'Які казки на ніч почитати дитині?', a: 'Для малюків — короткі казки на 3–5 хвилин: про їжачка Колючка, сніговика Ґудзика, друзів-мурах. Старшим дітям — довші історії з продовженням, як «Теплі історії пана Кота». Добірки за темами — вгорі сторінки.' },
  { q: 'Чи безкоштовно читати казки на Балабонах?', a: 'Так, казки на ніч можна читати онлайн безкоштовно, без реєстрації.' },
  { q: 'Хто пише ці казки?', a: 'Сучасні українські авторки й автори, а також редакція Балабонів. Є й казки народів світу в українському перекладі.' },
  { q: 'Скільки часу читати казку перед сном?', a: 'Оптимально 5–15 хвилин. Якщо дитина втомлена, оберіть коротку казку з добірки «Короткі казки на ніч».' },
]

/* Сторінка лишається заточеною під запит «казки» — це найсильніше
   пошукове слово в дитячому сегменті. Дитячі оповідання додано СЮДИ ж,
   окремою секцією, а не на другу адресу: два розділи з тим самим змістом
   Google рахував би дублями й розмив би обидва.

   ПЕРЕПИСАНО 17.09.2026 ЗА ВИМІРОМ. Search Console за 28 днів: ця сторінка
   дала 27 показів і ОДИН клік на позиції 10,19 — найгірший CTR на сайті
   при найбільшій кількості показів у каталозі. Причина в заголовку:
   «Казки українською» ловить запит, якого майже немає, тоді як
   «казки на ніч» дає 10–100 тис./міс при низькій конкуренції
   (Планувальник, 16.09.2026), «казки на ніч читати» — 1–10 тис.
   Жанровий розділ перейменували 16.09, а цю сторінку забули — і вийшло
   дві адреси про казки, рівно те, чого коментар вище застерігав уникати.
   Канонічною лишається ця: у неї є друга секція, оповідання для дітей. */
export const metadata: Metadata = {
  title: 'Казки на ніч — читати онлайн українською | Балабони',
  description: 'Казки на ніч читати онлайн українською — безкоштовно. Добрі й сучасні казки та оповідання для дітей на кожен вечір.',
  alternates: { canonical: '/fairytales' },
  openGraph: {
    title: 'Казки на ніч — читати онлайн українською | Балабони',
    description: 'Казки на ніч українською: добрі й сучасні історії для дітей на кожен вечір.',
    url: 'https://balabony.com/fairytales',
    type: 'website',
  },
}

interface StoryRow {
  slug: string
  title: string
  author_name: string
  genre: string | null
  text: string
  corrected_text: string | null
  humanized_text: string | null
  published_version: string | null
  cover_url: string | null
  is_adult: boolean | null
}

async function getFairytales(): Promise<Story[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, author_name, genre, text, corrected_text, humanized_text, published_version, cover_url, approved_at, is_adult')
    .eq('type', 'story')
    .eq('genre', 'Казка')
    .in('status', ['approved', 'published'])
    .order('approved_at', { ascending: false })
  if (error || !data) return []
  return (data as (StoryRow & { approved_at: string })[]).map((s) => ({
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

/**
 * Оповідання для дітей: усе з категорії «Дитячі», що не є казкою.
 *
 * Поле `category` у нас позначає джерело («ГАЗЕТА "ЖИТТЯ"» тощо), і серед
 * них є одна змістовна — «Дитячі». Зараз у ній лише казки, тож секція поки
 * порожня й не показується. Щойно редактор поставить твору цю категорію,
 * оповідання з'явиться тут само, без правок коду.
 */
async function getKidsStories(): Promise<Story[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, author_name, genre, text, corrected_text, humanized_text, published_version, cover_url, approved_at, is_adult')
    .eq('type', 'story')
    .eq('category', 'Дитячі')
    .neq('genre', 'Казка')
    .in('status', ['approved', 'published'])
    .order('approved_at', { ascending: false })
  if (error || !data) return []
  return (data as (StoryRow & { approved_at: string })[]).map((s) => ({
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

export default async function FairytalesPage() {
  const [stories, kids] = await Promise.all([getFairytales(), getKidsStories()])

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <Breadcrumbs items={[{ label: 'Казки на ніч' }]} />
        <h1 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 32, marginBottom: 8, color: 'var(--accent-gold)' }}>
          Казки на ніч
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 640 }}>
          Казки на ніч і оповідання для дітей — читати онлайн українською, безкоштовно.
        </p>
        <TemyNav />

        {stories.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Казок поки немає.</p>
        ) : (
          <FreshStoriesGrid stories={stories} />
        )}

        {kids.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h2 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 24, marginBottom: 16, color: 'var(--accent-gold)' }}>
              Оповідання для дітей
            </h2>
            <FreshStoriesGrid stories={kids} />
          </section>
        )}

        <section style={{ marginTop: 48, maxWidth: 760 }}>
          <h2 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 24, marginBottom: 12, color: 'var(--accent-gold)' }}>Казки на ніч українською</h2>
          <p style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 1.7, margin: '0 0 12px' }}>
            Казка перед сном — це кілька тихих хвилин, коли дитина заспокоюється, а дорослий поруч. На Балабонах зібрані добрі казки на ніч від сучасних українських авторів і редакції: короткі — на 3–5 хвилин, довші — з продовженням на кілька вечорів. Усі можна читати онлайн безкоштовно.
          </p>
          <p style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 1.7, margin: 0 }}>
            Шукаєте щось конкретне? Перегляньте добірки: <Link href="/fairytales/korotki" style={{ color: '#FAC775' }}>короткі казки на ніч</Link>, <Link href="/fairytales/pro-tvaryn" style={{ color: '#FAC775' }}>казки про тварин</Link> і <Link href="/fairytales/zymovi" style={{ color: '#FAC775' }}>зимові й новорічні казки</Link>.
          </p>
          <h2 style={{ fontFamily: '"Comfortaa", sans-serif', fontSize: 24, margin: '32px 0 12px', color: 'var(--accent-gold)' }}>Питання й відповіді</h2>
          {FAQ.map((f) => (
            <div key={f.q} style={{ margin: '0 0 14px' }}>
              <h3 style={{ fontSize: 18, color: '#f1f5f9', margin: '0 0 4px' }}>{f.q}</h3>
              <p style={{ color: '#cbd5e1', fontSize: 16, lineHeight: 1.7, margin: 0 }}>{f.a}</p>
            </div>
          ))}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }) }} />
        </section>

        {/* Перелінковка дитячих розділів (27.10.2026): казки ↔ загадки ↔ скоромовки. */}
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, marginTop: 40 }}>
          Ще для дитини:{' '}
          <Link href="/zahadky" style={{ color: '#FAC775' }}>загадки з відповідями</Link>
          {' · '}
          <Link href="/skoromovky" style={{ color: '#FAC775' }}>скоромовки</Link>
          {' · '}
          <Link href="/kvesty" style={{ color: '#FAC775' }}>квести з дипломом</Link>
        </p>
      </main>
      <Footer />
      <AudioPlayer />
    </ThemeProvider>
  )
}
