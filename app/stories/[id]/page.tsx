import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { Metadata } from 'next'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import ShareButtons from '@/app/components/ShareButtons'
import ReaderPulse from '@/app/components/ReaderPulse'
import StoryReadTracker from '@/app/components/StoryReadTracker'
import AgeGate from '@/app/components/AgeGate'
import AudioPlayer from '@/app/components/AudioPlayer'
import { looksLikeHtml, htmlToPlain } from '@/lib/plain-text'

const GOLD      = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY      = '#0f1e3a'
const FONT      = "'Montserrat', Arial, sans-serif"

interface StoryRow {
  id:                string
  title:             string
  author_name:       string
  genre:             string
  text:              string
  corrected_text:    string | null
  humanized_text:    string | null
  published_version: string | null
  cover_url:         string | null
  images:            string[] | null
  is_adult:          boolean | null
  approved_at:       string
  audio_url:         string | null
  audio_status:      string | null
}

async function getStory(id: string): Promise<StoryRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('id, slug, title, author_name, genre, text, corrected_text, humanized_text, published_version, cover_url, images, is_adult, approved_at, audio_url, audio_status')
    .eq('type', 'story')
    .eq('slug', id)
    .in('status', ['approved', 'published'])
    .maybeSingle()

  if (error || !data) return null
  return data as StoryRow
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const story = await getStory(id)
  if (!story) return { title: 'Історія не знайдена' }

  const desc    = story.text.replace(/\s+/g, ' ').trim().slice(0, 160)
  const url      = `/stories/${id}`
  // Fall back to the site OG image so shared links always show a preview card.
  const ogImage = story.cover_url ?? '/og-image.jpg'

  return {
    title:       `${story.title} — ${story.author_name} | Balabony`,
    description: desc,
    alternates:  { canonical: url },
    openGraph: {
      type:        'article',
      url,
      siteName:    'Balabony™',
      locale:      'uk_UA',
      title:       `${story.title} — ${story.author_name}`,
      description: desc,
      images:      [{ url: ogImage, width: 1200, height: 630, alt: story.title }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${story.title} — ${story.author_name}`,
      description: desc,
      images:      [ogImage],
    },
  }
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const story = await getStory(id)
  if (!story) notFound()

  const v    = story.published_version ?? 'original'
  const body = (v === 'humanized' || v === 'corrected_humanized') && story.humanized_text
    ? story.humanized_text
    : v === 'corrected' && story.corrected_text
      ? story.corrected_text
      : story.text

  const wordCount = body.trim().split(/\s+/).length
  const isFairytale = story.genre === 'Казка'
  const readMin   = Math.ceil(wordCount / 180)
  const date      = story.approved_at
    ? new Date(story.approved_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT }}>
            <div style={{ maxWidth: 720, margin: '0 auto', padding: story.cover_url ? '0 20px 80px' : '60px 20px 80px' }}>

        {/* Хлібні крихти — заміна старого back link */}
        <div style={{ marginTop: 24 }}>
          <Breadcrumbs
            items={[
              isFairytale
                ? { label: 'Казки', href: '/fairytales' }
                : { label: 'Історії читачів', href: '/stories' },
              { label: story.title },
            ]}
          />
        </div>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          {/* Genre tag */}
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize', fontFamily: FONT, letterSpacing: 0.4 }}>
            {story.genre}
          </span>

          {/* Title */}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f5f0e8', lineHeight: 1.25, margin: '14px 0 10px', fontFamily: FONT }}>
            {story.title}
          </h1>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: GOLD, fontFamily: FONT }}>{story.author_name}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-dark-muted)', fontFamily: FONT }}>{date}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-dark-muted)', fontFamily: FONT }}>{wordCount} слів · ~{readMin} хв</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(239,159,39,0.4), transparent)', marginBottom: 36 }} />

        {/* Story body */}
        {story.is_adult ? (
          <AgeGate>
            <article
              style={{ fontSize: 18, lineHeight: 1.9, color: '#dde6f0', fontFamily: FONT, wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: toStoryHtml(body, story.images ?? []) }}
            />
          </AgeGate>
        ) : (
          <article
            style={{ fontSize: 18, lineHeight: 1.9, color: '#dde6f0', fontFamily: FONT, wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: toStoryHtml(body, story.images ?? []) }}
          />
        )}

        {/* Облік прочитання — база для винагороди автора. Маркер кінця тексту
            має стояти саме тут, одразу під статтею. */}
        <StoryReadTracker contentId={story.id} slug={id} title={story.title} readMinutes={readMin} />

        {/* Три питання тому, хто дочитав */}
        <ReaderPulse contentId={story.id} />

        {/* Поширення */}
        <div style={{ marginTop: 40 }}>
          <ShareButtons url={`https://balabony.com/stories/${id}`} title={story.title} storyId={story.id} />
        </div>

        {/* Footer */}
        <div style={{ marginTop: 52, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--on-dark-muted)', fontFamily: FONT }}>
            Автор: <strong style={{ color: '#c8d4e8' }}>{story.author_name}</strong>
          </div>
          <a
            href={isFairytale ? '/fairytales' : '/'}
            style={{ fontSize: 13, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 10, padding: '8px 18px', textDecoration: 'none', fontFamily: FONT }}
          >
            {isFairytale ? 'Більше казок →' : 'Більше історій →'}
          </a>
        </div>

      </div>

      {/* Аудіоплеєр: показує плеєр, якщо audio_status='ready', інакше «у розробці» */}
      <AudioPlayer audioUrl={story.audio_url} audioStatus={story.audio_status} title={story.title} contentId={story.id} />
    </div>
  )
}

function escapeChars(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Розпізнає репліку формату «Імʼя: текст» на початку абзацу і фарбує імʼя золотим
// (як у серіалах). У казках персонажі довільні, тому імʼя визначаємо ЗАГАЛЬНИМ
// правилом, а не списком: з великої літери, ≤3 слова, ≤20 символів, без розділових
// знаків і дужок усередині — щоб не зачепити звичайну нарацію з двокрапкою.
const SPEAKER_RE = /^([А-ЯІЇЄҐ][^:\n.!?,;–—()]{0,19}):\s/

function renderParaInner(p: string): string {
  const m = p.match(SPEAKER_RE)
  if (m) {
    const name = m[1]
    const words = name.trim().split(/\s+/)
    if (words.length <= 3) {
      const rest = p.slice(m[0].length)
      return `<strong style="color:${GOLD};font-weight:700">${escapeChars(name)}:</strong> ${escapeChars(rest)}`
    }
  }
  return escapeChars(p)
}

// Розбиває текст на абзаци й обгортає кожен у <p> з відступом 14px.
// Якщо є ілюстрації (казки) — рівномірно розставляє їх між абзацами,
// за хронологією: малюнок 1 ближче до початку, останній — ближче до кінця.
function toStoryHtml(raw: string, images: string[] = []): string {
  const source = looksLikeHtml(raw) ? htmlToPlain(raw) : raw
  const paras = source
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  const imgs = (images ?? []).filter(u => typeof u === 'string' && u.length > 0)

  // Куди вставляти кожен малюнок: після абзацу з індексом pos
  const insertAfter = new Map<number, string[]>()
  if (imgs.length > 0 && paras.length > 0) {
    for (let k = 0; k < imgs.length; k++) {
      const pos = Math.min(
        paras.length - 1,
        Math.max(0, Math.round((paras.length * (k + 1)) / (imgs.length + 1)) - 1)
      )
      const arr = insertAfter.get(pos) ?? []
      arr.push(imgs[k])
      insertAfter.set(pos, arr)
    }
  }

  const imgTag = (url: string) =>
    `<img src="${url}" alt="" loading="lazy" style="display:block;width:100%;max-width:560px;margin:28px auto;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,0.35)" />`

  let html = ''
  paras.forEach((p, i) => {
    html += `<p style="margin:0 0 14px 0">${renderParaInner(p)}</p>`
    const here = insertAfter.get(i)
    if (here) here.forEach(u => { html += imgTag(u) })
  })
  return html
}
