import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { Metadata } from 'next'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import ShareButtons from '@/app/components/ShareButtons'
import ReaderPulse from '@/app/components/ReaderPulse'
import LikeButton from '@/app/components/LikeButton'
import StoryReadTracker from '@/app/components/StoryReadTracker'
import AgeGate from '@/app/components/AgeGate'
import AudioPlayer from '@/app/components/AudioPlayer'
import StoryEmailCapture from '@/app/components/StoryEmailCapture'
import { toPlainText, toExcerpt } from '@/lib/plain-text'
import { leadInlineStyle, fitsLead } from '@/lib/reader-typography'
import { authorSlug } from '@/lib/author-slug'
import ReaderSettings from '@/app/components/ReaderSettings'

// Базовий кегль тексту історії — має збігатися зі стилем <article> нижче.
const BODY_FONT_SIZE = 18
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
  is_free:           boolean | null
  updated_at:        string | null
  is_premium:        boolean | null
  approved_at:       string
  audio_url:         string | null
  audio_status:      string | null
}

async function getStory(id: string): Promise<StoryRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('id, slug, title, author_name, genre, text, corrected_text, humanized_text, published_version, cover_url, images, is_adult, is_free, is_premium, approved_at, updated_at, audio_url, audio_status')
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

  const desc    = toExcerpt(story.text, 160)
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
      // Розмір навмисно не вказуємо: ogImage — це або обкладинка твору
      // (квадрат 1:1, такий формат потрібен подкаст-стрічці), або запасна
      // картинка 1200×630. Жорстко заявлені 1200×630 брехали в першому
      // випадку, і соцмережі обрізали зображення по-своєму. Без розміру
      // вони визначають його самі й показують правильно.
      images:      [{ url: ogImage, alt: story.title }],
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

  // Розмітка для пошуковиків.
  //
  // Без неї Google бачить сторінку як звичайний текст: ані автора, ані дати,
  // ані того, що це літературний твір. З 25 листопада частина історій піде за
  // передплатою, і тоді isAccessibleForFree стає обов'язковим — інакше пошук
  // вважає, що читачеві показують одне, а роботу інше, і знижує сторінку у
  // видачі. cssSelector вказує на той самий блок, який ховає пейвол.
  const freeToRead = story.is_free !== false && story.is_premium !== true
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    author: {
      '@type': 'Person',
      name: story.author_name,
      url: `https://balabony.com/avtor/${authorSlug(story.author_name)}`,
    },
    datePublished: story.approved_at,
    dateModified: story.updated_at ?? story.approved_at,
    inLanguage: 'uk-UA',
    image: story.cover_url ? [story.cover_url] : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Balabony',
      url: 'https://balabony.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://balabony.com/icon-512.png',
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://balabony.com/stories/${id}`,
    },
    isAccessibleForFree: freeToRead,
    ...(freeToRead
      ? {}
      : {
          hasPart: {
            '@type': 'WebPageElement',
            isAccessibleForFree: false,
            cssSelector: '.story-body',
          },
        }),
  }

  const wordCount = body.trim().split(/\s+/).length
  // Знаки чистого тексту — з них рахується мінімальний час перегляду
  // за договором (15 секунд на кожні 1000 знаків, п. 1.5).
  const charCount = toPlainText(body).length
  const isFairytale = story.genre === 'Казка'
  const readMin   = Math.ceil(wordCount / 180)
  const date      = story.approved_at
    ? new Date(story.approved_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div
      className="reader-root"
      style={{
        minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT,
        // Базовий кегль саме цієї читалки — від нього рахується масштаб.
        ['--r-base' as string]: `${BODY_FONT_SIZE}px`,
      } as React.CSSProperties}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Обкладинка не показувалася зовсім: відступ під неї в контейнері нижче
          був, а самої картинки — ні. Показуємо так само, як у серіях і «Тиші»:
          у власному співвідношенні, без обрізання. */}
      {story.cover_url && (
        <div style={{ position: 'relative', maxWidth: 460, margin: '14px auto 0', aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.cover_url} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

            <div className="reader-col" style={{ maxWidth: 720, margin: '0 auto', padding: story.cover_url ? '20px 20px 80px' : '60px 20px 80px' }}>

        {/* Хлібні крихти — заміна старого back link */}
        <div style={{ marginTop: 24 }}>
          <Breadcrumbs
            items={[
              isFairytale
                ? { label: 'Казки', href: '/fairytales' }
                : { label: 'Історії', href: '/stories' },
              { label: story.title },
            ]}
          />
        </div>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          {/* Жанр. Умова обов'язкова: у частини творів поле порожнє, і бейдж
              малювався як безглуздий порожній кружечок над заголовком. */}
          {story.genre?.trim() && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--r-gold, #ef9f27)', background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize', fontFamily: FONT, letterSpacing: 0.4 }}>
              {story.genre}
            </span>
          )}

          {/* Title */}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f5f0e8', lineHeight: 1.25, margin: '14px 0 10px', fontFamily: FONT }}>
            {story.title}
          </h1>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--r-gold, #ef9f27)', fontFamily: FONT }}>{story.author_name}</span>
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
              className="story-body reader-body"
              style={{ fontSize: 18, lineHeight: 1.9, color: '#dde6f0', fontFamily: FONT, wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: toStoryHtml(body, story.images ?? []) }}
            />
          </AgeGate>
        ) : (
          <article
            className="story-body reader-body"
            style={{ fontSize: 18, lineHeight: 1.9, color: '#dde6f0', fontFamily: FONT, wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: toStoryHtml(body, story.images ?? []) }}
          />
        )}

        {/* Облік прочитання — база для винагороди автора. Маркер кінця тексту
            має стояти саме тут, одразу під статтею. */}
        <StoryReadTracker contentId={story.id} slug={id} title={story.title} charCount={charCount} />

        {/* Вподобання: найпростіша дія, тому стоїть першою під текстом. */}
        <LikeButton contentId={story.id} />

        {/* Збір пошти. Стоїть саме тут — після тексту й лайку, до опитування:
            читач із газети по QR потрапляє одразу сюди, і це єдина точка,
            де його можна втримати. */}
        <StoryEmailCapture slug={id} />

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
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--r-gold, #ef9f27)', background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 10, padding: '8px 18px', textDecoration: 'none', fontFamily: FONT }}
          >
            {isFairytale ? 'Більше казок →' : 'Більше історій →'}
          </a>
        </div>

      </div>

      {/* Аудіоплеєр: показує плеєр, якщо audio_status='ready', інакше «у розробці» */}
      <AudioPlayer audioUrl={story.audio_url} audioStatus={story.audio_status} title={story.title} contentId={story.id} />

      {/* Шрифт, розмір літер, день/ніч */}
      <ReaderSettings />
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
      return `<strong class="speaker-name" style="color:${GOLD};font-weight:700">${escapeChars(name)}:</strong> ${escapeChars(rest)}`
    }
  }
  return escapeChars(p)
}

// Розбиває текст на абзаци й обгортає кожен у <p> з відступом 14px.
// Якщо є ілюстрації (казки) — рівномірно розставляє їх між абзацами,
// за хронологією: малюнок 1 ближче до початку, останній — ближче до кінця.
function toStoryHtml(raw: string, images: string[] = []): string {
  const source = toPlainText(raw)
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

  // Перший абзац — лід: трохи більший і світліший за решту. Це журнальний
  // прийом, за який чіпляється око на початку тексту. Кольором не виділяємо
  // навмисно: золото на сайті означає керування (кнопки, меню, посилання),
  // і золотий абзац читався б як щось клікабельне.
  const LEAD = leadInlineStyle(BODY_FONT_SIZE)

  let html = ''
  paras.forEach((p, i) => {
    // На репліку («Панас: …») лід не ставимо: там уже є золоте імʼя,
    // другий акцент поруч перевантажив би рядок.
    // Довгий перший абзац лідом не робимо — див. LEAD_MAX_CHARS.
    const isLead = i === 0 && !SPEAKER_RE.test(p) && fitsLead(p)
    const style = isLead ? LEAD : 'margin:0 0 14px 0'
    html += `<p${isLead ? ' class="lead"' : ''} style="${style}">${renderParaInner(p)}</p>`
    const here = insertAfter.get(i)
    if (here) here.forEach(u => { html += imgTag(u) })
  })
  return html
}
