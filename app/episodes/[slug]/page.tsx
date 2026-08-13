import { notFound } from 'next/navigation'
import { readingMinutes } from '@/lib/readingTime'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getAnonUserId } from '@/lib/anon-user'
import type { Metadata } from 'next'
import EpisodePaywall from './EpisodePaywall'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import ShareButtons from '@/app/components/ShareButtons'
import EpisodeCliffhanger from '@/app/components/EpisodeCliffhanger'
import ReaderPulse from '@/app/components/ReaderPulse'
import StreakTracker from '@/app/components/StreakTracker'
import ReadTracker from '@/app/components/ReadTracker'
import StoryReadTracker from '@/app/components/StoryReadTracker'
import StoryEmailCapture from '@/app/components/StoryEmailCapture'
import AudioPlayer from '@/app/components/AudioPlayer'
import { leadCssDeclarations } from '@/lib/reader-typography'
import { toExcerpt, toPlainText } from '@/lib/plain-text'

const GOLD      = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const FONT      = "'Montserrat', Arial, sans-serif"
// Базовий кегль тексту серії — має збігатися з <article> в EpisodeBody.
const BODY_FONT_SIZE = 16

interface EpisodeRow {
  id:                string
  slug:              string
  title:             string
  description:       string | null
  season_number:     number
  episode_number:    number
  is_premium:        boolean
  text:              string
  corrected_text:    string | null
  humanized_text:    string | null
  published_version: string | null
  cover_url:         string | null
  approved_at:       string
  hook:              string | null
  next_teaser:       string | null
  next_release_date: string | null
  audio_url:         string | null
  audio_status:      string | null
  recap:             string | null
}

async function getEpisode(slug: string): Promise<EpisodeRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('id, slug, title, description, season_number, episode_number, is_premium, text, corrected_text, humanized_text, published_version, cover_url, approved_at, hook, next_teaser, next_release_date, audio_url, audio_status, recap')
    .eq('type', 'balabony')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return data as EpisodeRow
}

interface NextRow {
  slug:           string
  season_number:  number
  episode_number: number
  is_premium:        boolean
  cover_url:      string | null
}

async function getNextEpisode(season: number, episode: number): Promise<NextRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('slug, season_number, episode_number, cover_url')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or(`season_number.gt.${season},and(season_number.eq.${season},episode_number.gt.${episode})`)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true })
    .limit(1)

  if (error || !data || data.length === 0) return null
  return data[0] as NextRow
}

interface PrevRecapRow {
  title:          string
  season_number:  number
  episode_number: number
  is_premium:        boolean
  recap:          string | null
}

// Позиція серії В МЕЖАХ сезону (1 = перша серія сезону).
// episode_number наскрізний по всьому серіалу, тому рахуємо, скільки
// опублікованих серій цього ж сезону мають менший номер.
async function positionInSeason(season: number, episode: number): Promise<number> {
  const supabase = getSupabaseAdmin()
  const { count, error } = await supabase
    .from('content')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'balabony')
    .eq('status', 'published')
    .eq('season_number', season)
    .lt('episode_number', episode)
  // При збої бази серію ЗАКРИВАЄМО, а не відкриваємо. Раніше тут стояло
  // `return 1` — тобто будь-яка помилка запиту робила серію «першою в
  // сезоні» й роздавала платний текст безкоштовно. Число ніде не
  // показується читачеві, лише порівнюється з FREE_PER_SEASON, тож
  // велике значення просто означає «не вітрина».
  if (error || count == null) {
    console.error('[positionInSeason] fail-closed:', error)
    return Number.MAX_SAFE_INTEGER
  }
  return count + 1
}
// Попередній епізод за наскрізною нумерацією (дзеркало getNextEpisode).
// Через межу сезону теж працює: останній епізод минулого сезону.
async function getPrevEpisode(season: number, episode: number): Promise<PrevRecapRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('title, season_number, episode_number, recap')
    .eq('type', 'balabony')
    .eq('status', 'published')
    .or(`season_number.lt.${season},and(season_number.eq.${season},episode_number.lt.${episode})`)
    .order('season_number', { ascending: false })
    .order('episode_number', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return null
  return data[0] as PrevRecapRow
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const episode = await getEpisode(slug)
  if (!episode) return { title: 'Епізод не знайдено' }

  const desc = toExcerpt(episode.description ?? episode.text, 160)
  const url = `/episodes/${slug}`
  const ogImage = episode.cover_url ?? '/og-image.jpg'
  const ogTitle = `${episode.title} · Сезон ${episode.season_number}, Серія ${episode.episode_number}`

  return {
    title:       `${episode.title} · Балабони`,
    description: desc,
    alternates:  { canonical: url },
    openGraph: {
      type:        'article',
      url,
      siteName:    'Balabony™',
      locale:      'uk_UA',
      title:       ogTitle,
      description: desc,
      images:      [{ url: ogImage, width: 1200, height: 630, alt: episode.title }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       ogTitle,
      description: desc,
      images:      [ogImage],
    },
  }
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const episode = await getEpisode(slug)
  if (!episode) notFound()

  // Залогінений власник (адмін) читає всі серії без paywall
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === process.env.ADMIN_PASSWORD
  // ── Хто читає і що йому вже доступно.
  // 10.08.2026: раніше сторінка звірялась лише з позицією серії в сезоні
  // й не бачила user_free_picks — читач «обирав» серію, ліміт списувався,
  // а замок лишався. Тепер вибір і підписка враховуються тут.
  // 11.08.2026: тут був getOrCreateAnonUserId(), який СТВОРЮЄ куку. Next.js
  // забороняє записувати куки під час рендерингу сторінки (лише Server Action
  // або Route Handler), тому сторінка падала з 500 для кожного, хто заходив
  // УПЕРШЕ й куки ще не мав — тобто рівно для читачів, що приходять по QR
  // з газети. У браузері з наявною кукою помилка не відтворювалась.
  // Тепер лише читаємо: у нового читача ані вибору, ані підписки бути не може,
  // а сама кука створиться при першому виклику /api/*, де це дозволено.
  const readerId = await getAnonUserId()
  const db = getSupabaseAdmin()

  const { data: pickRow } = readerId
    ? await db
        .from('user_free_picks')
        .select('id')
        .eq('user_id', readerId)
        .eq('content_type', 'series')
        .eq('content_id', episode.episode_number)
        .maybeSingle()
    : { data: null }
  const hasPick = Boolean(pickRow)

  const { data: subRow } = readerId
    ? await db
        .from('app_subscriptions')
        .select('id, plan')
        .eq('user_id', readerId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle()
    : { data: null }
  const hasSub = Boolean(subRow)

  // Бонусні серії (is_premium) відкриті лише річним підписникам і
  // пільговикам. Місячна підписка їх НЕ відкриває — раніше тут стояла
  // проста перевірка «є будь-яка активна підписка», через що місячник
  // бачив те саме, що й річний. /api/episode уже працював за правилом
  // plan === 'yearly'; тепер сторінка серії з ним узгоджена.
  const { data: benefitRow } = readerId
    ? await db
        .from('benefit_status')
        .select('valid_until')
        .eq('user_id', readerId)
        .maybeSingle()
    : { data: null }
  const hasBenefit = Boolean(
    benefitRow &&
      (!benefitRow.valid_until ||
        new Date(benefitRow.valid_until).getTime() >= Date.now())
  )
  const hasPremiumAccess = subRow?.plan === 'yearly' || hasBenefit

  const nextEp = await getNextEpisode(episode.season_number, episode.episode_number)
  const seasonPosition = await positionInSeason(episode.season_number, episode.episode_number)
  const prevEp = await getPrevEpisode(episode.season_number, episode.episode_number)
  const prevRecap = prevEp?.recap?.trim() ? prevEp : null

  const v    = episode.published_version ?? 'original'
  const rawBody = (v === 'humanized' || v === 'corrected_humanized') && episode.humanized_text
    ? episode.humanized_text
    : v === 'corrected' && episode.corrected_text
      ? episode.corrected_text
      : episode.text
  // Через єдину функцію: знімає розмітку старих творів і декодує сутності
  // з Word («&ensp;», «&rsquo;»), які інакше видно читачеві як є.
  const body = toPlainText(rawBody)

  // Замок і промо рахуємо тут, бо від них залежить облік прочитань.
  // Правило дослівно те саме, що в EpisodePaywall: перші дві серії сезону
  // вільні, преміальна замкнена завжди, адмін бачить усе.
  // Вітрина: перша серія сезону відкрита всім без вибору.
  // Друга — за вибором через /api/pick. Разом 8 безкоштовних на 4 сезони.
  const FREE_PER_SEASON = 1
  const isPromoEpisode  = !episode.is_premium && seasonPosition <= FREE_PER_SEASON
  const isUnlocked      = isAdmin || isPromoEpisode || (episode.is_premium ? hasPremiumAccess : (hasSub || hasPick))
  const isLocked        = !isUnlocked

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length
  const readMin   = readingMinutes(episode)
  const date      = episode.approved_at
    ? new Date(episode.approved_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT }}>
<StreakTracker />
<ReadTracker slug={episode.slug} />

      {episode.cover_url && (
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', aspectRatio: '1 / 1', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={episode.cover_url} alt={episode.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a1628 0%, rgba(10,22,40,0.4) 60%, transparent 100%)' }} />
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: episode.cover_url ? '0 20px 80px' : '60px 20px 80px' }}>

        <div style={{ marginTop: 24 }}>
          <Breadcrumbs items={[{ label: 'Серії', href: '/episodes' }, { label: episode.title }]} />
        </div>

        <div style={{ marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize', fontFamily: FONT, letterSpacing: 0.4 }}>
            Сезон {episode.season_number} · Серія {episode.episode_number}
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f5f0e8', lineHeight: 1.25, margin: '14px 0 10px', fontFamily: FONT }}>
            {episode.title}
          </h1>
          <div style={{ fontSize: 13.5, lineHeight: 1.4, margin: '0 0 12px', fontFamily: FONT }}>
            <span style={{ fontWeight: 700, color: GOLD }}>Назар Колодій</span>
            <span style={{ color: 'var(--on-dark-muted)', fontStyle: 'italic' }}> · Кумедні історії з українського села</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: GOLD, fontFamily: FONT }}>Балабони</span>
            {date && <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-dark-muted)', fontFamily: FONT }}>{date}</span>}
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-dark-muted)', fontFamily: FONT }}>{wordCount} слів · ~{readMin} хв</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(239,159,39,0.4), transparent)', marginBottom: 36 }} />

        {prevRecap && (
          <div style={{
            marginBottom: 32,
            padding: '18px 20px',
            background: `${GOLD}0f`,
            border: `1px solid ${GOLD}33`,
            borderRadius: 12,
            borderLeft: `3px solid ${GOLD}`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase',
              letterSpacing: 0.6, marginBottom: 8, fontFamily: FONT,
            }}>
              Що було раніше
            </div>
            <p style={{
              margin: 0, fontSize: 15, lineHeight: 1.6, color: '#d8d2c6',
              fontFamily: FONT, fontStyle: 'italic',
            }}>
              {prevRecap.recap}
            </p>
          </div>
        )}

<EpisodePaywall html={formatEpisodeText(body)} fontFamily={FONT} seasonNumber={episode.season_number} episodeNumber={seasonPosition} bypass={isAdmin} isPremium={episode.is_premium} hasPick={hasPick} hasSub={hasSub} hasPremiumAccess={hasPremiumAccess} globalEpisodeNumber={episode.episode_number} />
        {/* Облік прочитань за договором (п. 1.5). Замкнену серію не рахуємо
            взагалі: читач бачить тізер, а 70% обсягу тізера — це не 70%
            обсягу твору. Маркер стоїть під текстом — від нього трекер
            знаходить <article> і міряє, скільки тексту побувало на екрані. */}
        {!isLocked && (
          <StoryReadTracker
            contentId={episode.id}
            slug={episode.slug}
            title={episode.title}
            charCount={body.length}
            promo={isPromoEpisode}
            analytics={false}
          />
        )}

        {/* Гачок і перехід на наступну серію — одразу під текстом.
            Раніше стояв після пошти й шерингу: читач мусив пройти два
            блоки, перш ніж дізнавався, що буде далі. Тепер найсильніший
            мотиватор іде першим, а пошту просимо вже в розігрітого.

            Гачок — це кінцівка ПОТОЧНОЇ серії, тож на замкненій його
            не показуємо: інакше читач без доступу безкоштовно отримує
            фінал того, за що мав би заплатити. Тизер наступної серії
            й обкладинка лишаються — вони нічого не спойлерять і саме
            вони продають передплату. */}
        {((!isLocked && episode.hook) || episode.next_teaser || nextEp) && (
          <div style={{ marginTop: 44, marginLeft: -20, marginRight: -20 }}>
            <EpisodeCliffhanger
              hook={!isLocked ? (episode.hook ?? undefined) : undefined}
              next={(episode.next_teaser || nextEp) ? {
                season:      nextEp?.season_number ?? episode.season_number,
                number:      nextEp?.episode_number ?? episode.episode_number + 1,
                teaser:      episode.next_teaser ?? '',
                coverUrl:    nextEp?.cover_url ?? undefined,
                releaseDate: episode.next_release_date ?? undefined,
                readUrl:     nextEp ? `/episodes/${nextEp.slug}` : undefined,
              } : undefined}
              allSeriesUrl="/episodes"
            />
          </div>
        )}

        {/* Збір пошти. Головна точка втримання: саме сюди веде QR з газети,
            і без цього блока читач із паперу зникає назавжди. Стоїть перед
            опитуванням — його бачать усі, а опитування лише ті, кому відкрито
            серію цілком. */}
        <StoryEmailCapture slug={slug} />

        {/* Три питання — лише тому, хто побачив серію цілком.
            Умова замка повторює EpisodePaywall: перші дві серії сезону вільні. */}
        {(isAdmin || (!episode.is_premium && seasonPosition <= 2)) && (
          <ReaderPulse contentId={episode.id} />
        )}

        <div style={{ marginTop: 40 }}>
          <ShareButtons url={`https://balabony.com/episodes/${slug}`} title={episode.title} storyId={episode.id} season={episode.season_number} />
        </div>

        <div style={{ marginTop: 52, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--on-dark-muted)', fontFamily: FONT }}>
            Сезон {episode.season_number} · Серія {episode.episode_number}
          </div>
          <a href="/" style={{ fontSize: 13, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 10, padding: '8px 18px', textDecoration: 'none', fontFamily: FONT }}>Більше епізодів →</a>
        </div>

      </div>

      {/* Аудіоплеєр: показує плеєр, якщо audio_status='ready', інакше «у розробці» */}
      <AudioPlayer audioUrl={episode.audio_url} audioStatus={episode.audio_status} title={episode.title} contentId={episode.id} slug={episode.slug} />
    </div>
  )
}

const CHARACTERS = [
  'Панас', 'Ганя', 'Максим', 'Стьопа', 'Орися', 'Віталій',
  'Люба', 'Микола', 'Мотря', 'Семен', 'Степан', 'Борько',
  'Надя', 'Гена', 'Вольодя', 'Артем', 'Аліна', 'Аферист', 'Гість',
  'Григорій', 'Отець Василь', 'Параска', 'Люся', 'Оверко',
  'Інспектор', 'Метеоролог', 'Радіо', 'Система', 'Пеструха',
  'Дільничний Микола', 'Зять Віталій', 'Сусід Стьопа',
  'Баба Ганя', 'Баба Орися', 'Баба Мотря', 'Баба Параска',
  'Дід Панас', 'Онук Максим', 'Дід Оверко', 'Поштар Петро', 'Коваль Степан', 'Сашко', 'Петро', 'Степанич', 'Вадим', 'Іван', 'Галина', 'Христина', 'Віра', 'Василь', 'Роман', 'Зоя', 'Опанас Тракторист', 'Кандиба', 'Отець Павло', 'Юхим', 'Захар', 'Тетяна', 'Марія', 'Стефа', 'Тодось', 'Даринка', 'Денис', 'Охрім', 'Савка', 'Одарка', 'Оксана', 'Галька', 'Марфа', 'Губернатор', 'Баба Зоя', 'Галина Сергіївна', 'Степан', 'Хор',
]
const CHAR_PATTERN = CHARACTERS
  .sort((a, b) => b.length - a.length)
  .map(escapeRegex)
  .join('|')
const SPEAKER_REGEX = new RegExp(`^(${CHAR_PATTERN}):\\s`)

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtmlChars(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatEpisodeText(raw: string): string {
  const scenes = raw.split(/\n{2,}/)
  const renderedScenes = scenes.map((scene, sceneIdx) => {
    const paragraphs = scene.split(/\n/).filter(p => p.trim().length > 0)
    const renderedParagraphs = paragraphs.map(p => {
      const trimmed = p.trim()
      const match = trimmed.match(SPEAKER_REGEX)
      if (match) {
        const speaker = match[1]
        const rest = trimmed.slice(match[0].length)
        return `<p class="speaker"><strong style="color:${GOLD};font-weight:700">${escapeHtmlChars(speaker)}:</strong> ${escapeHtmlChars(rest)}</p>`
      }
      return `<p class="narrative">${escapeHtmlChars(trimmed)}</p>`
    }).join('')
    const sceneClass = sceneIdx === 0 ? 'scene scene-first' : 'scene'
    return `<div class="${sceneClass}">${renderedParagraphs}</div>`
  }).join('')
  // Лід: перший абзац нарації трохи більший і світліший — око чіпляється за
  // початок. На репліки («Панас: …») не поширюється: там уже є золоте імʼя,
  // другий акцент поруч перевантажив би рядок.
  const styles = `<style>.scene{margin-top:28px}.scene-first{margin-top:0}.scene p{margin:0 0 14px 0}.scene p:last-child{margin-bottom:0}.speaker{padding-left:0}.narrative{}.scene-first p.narrative:first-child{${leadCssDeclarations(BODY_FONT_SIZE)}}</style>`
  return styles + renderedScenes
}
