import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import type { Metadata } from 'next'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import ShareButtons from '@/app/components/ShareButtons'
import BookmarkButton from '@/app/components/BookmarkButton'
import FollowAuthorButton from '@/app/components/FollowAuthorButton'
import VoiceVoteButton from '@/app/components/VoiceVoteButton'
import ReviewButton from '@/app/components/ReviewButton'
import ReaderPulse from '@/app/components/ReaderPulse'
import StoryReadTracker from '@/app/components/StoryReadTracker'
import ReadingPosition from '@/app/components/ReadingPosition'
import ReadingProgressBar from '@/app/components/ReadingProgressBar'
import BackToTop from '@/app/components/BackToTop'
import AgeGate from '@/app/components/AgeGate'
import AudioPlayer from '@/app/components/AudioPlayer'
import StoryEmailCapture from '@/app/components/StoryEmailCapture'
import { toPlainText, toExcerpt } from '@/lib/plain-text'
import { leadInlineStyle, fitsLead } from '@/lib/reader-typography'
import Link from 'next/link'
import { authorSlug } from '@/lib/author-slug'
import ReaderSettings from '@/app/components/ReaderSettings'
import RelatedStories from '@/app/components/RelatedStories'
import ContestBadge from '@/app/components/ContestBadge'
import { dbQuery } from '@/lib/db'
import { CONTESTS } from '@/lib/contests'

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
  author_id:         string | null
  status?:           string | null
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

/**
 * Твір за адресою. Фільтр статусу тут ЗНЯТО навмисно (09.09.2026).
 *
 * Автор мусив публікувати наосліп: чернетка давала 404, тобто побачити, як
 * ляжуть абзаци й чи не з'їхала обкладинка, можна було лише вже після
 * публікації. Тепер сторінка віддає і чернетку, але показує її ВИКЛЮЧНО
 * авторові — перевірка нижче, у StoryPage і в generateMetadata.
 *
 * Робити окрему сторінку перегляду було б гірше: другий рендер неминуче
 * розійшовся б із бойовим, і «як побачить читач» стало б неправдою.
 */
async function getStory(id: string): Promise<StoryRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('id, slug, title, author_name, author_id, genre, status, text, corrected_text, humanized_text, published_version, cover_url, images, is_adult, is_free, is_premium, approved_at, updated_at, audio_url, audio_status')
    .eq('type', 'story')
    .eq('slug', id)
    .maybeSingle()

  if (error || !data) return null
  return data as StoryRow
}

const PUBLIC_STATUSES = ['approved', 'published']

/** Чи бачить цю сторінку хтось, крім автора. */
function isPublic(story: { status?: string | null }): boolean {
  return PUBLIC_STATUSES.includes(String(story.status ?? ''))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const story = await getStory(id)
  if (!story) return { title: 'Історія не знайдена' }

  // Чернетку з пошуку прибираємо повністю: вона живе за справжньою адресою,
  // і без цього Google міг би дійти до неї за посиланням, яким автор
  // поділився, показуючи твір комусь.
  if (!isPublic(story)) {
    return {
      title: `${story.title} — чернетка | Balabony`,
      robots: { index: false, follow: false },
    }
  }

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

  // Неопублікований твір бачить лише його автор. Для решти — той самий 404,
  // що й раніше: сторонній не має навіть дізнатися, що така адреса існує.
  // Користувача дістаємо завжди, а не лише для чернеток: він потрібен ще й
  // для того, щоб не зараховувати авторові читання власного твору.
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnAuthor = !!user && !!story.author_id && user.id === story.author_id

  const draft = !isPublic(story)
  if (draft && !isOwnAuthor) notFound()

  // Чи твір поданий на конкурс — і на який саме.
  //
  // Дві причини знати це тут. Перша: в умовах записано, що конкурсні роботи
  // не блокуються нічим, і Ad Grants жене платний трафік саме на них — стіна
  // на такому творі коштувала б грошей за кожен клік. Друга: за нульовою
  // умовою підрахунку (lib/contest-reads.ts) дочитування зараховується в
  // конкурс ЛИШЕ з акаунта, гості відсіюються join-ом із users. Тобто саме
  // тут вхід важить найбільше — і читач має про це знати.
  //
  // Назву дістаємо з довідника CONTESTS за id, який лежить у contest_entries:
  // тримати другий перелік назв у базі означало б, що колись вони розійдуться.
  let contestName: string | null = null
  try {
    const r = await dbQuery(
      `select e.contest
         from contest_episodes ep
         join contest_entries e on e.id = ep.entry_id
        where ep.content_id = $1
        limit 1`,
      [story.id],
    )
    const id = r.rows[0]?.contest as string | undefined
    if (id) contestName = CONTESTS.find(c => c.id === id)?.name ?? 'конкурс Балабонів'
  } catch (e) {
    // Помилка запиту не має замикати твір: краще показати текст зайвий раз,
    // ніж закрити конкурсну роботу через збій. Але тоді стіни не буде НІДЕ,
    // і без запису в лог причина була б невидима — шукати довелося б навмання.
    console.error('[stories] contest lookup failed:', e)
  }

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

        {/* Чернетку показуємо з чесною плашкою: сторінка виглядає точно як
            бойова, тому без напису автор може вирішити, що твір уже на сайті,
            і не натиснути «Опублікувати». */}
        {draft && (
          <div style={{
            marginTop: 24, padding: '12px 16px', borderRadius: 10,
            background: 'rgba(239,159,39,0.12)', border: '1px solid rgba(239,159,39,0.45)',
            fontFamily: "'Montserrat', sans-serif", fontSize: 14, lineHeight: 1.6,
            color: '#FAC775',
          }}>
            <strong style={{ color: '#FFF8EE' }}>Це чернетка.</strong>{' '}
            Так твір побачить читач. Крім вас, цю сторінку зараз не бачить ніхто.{' '}
            <a href="/author/dashboard" style={{ color: '#FAC775', fontWeight: 700 }}>
              Опублікувати в кабінеті →
            </a>
          </div>
        )}

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

        {/* Позначка конкурсного твору. Стоїть вище за все інше, бо пояснює
            читачеві дві речі одразу: чому цей твір відкритий і чому саме тут
            варто увійти. */}
        {contestName && <ContestBadge contestName={contestName} guest={!user} path={`/stories/${id}`} />}

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
          <h1 style={{ fontSize: 'clamp(22px, 5.5vw, 28px)', fontWeight: 800, color: '#f5f0e8', lineHeight: 1.25, margin: '14px 0 10px', fontFamily: FONT, textWrap: 'balance' }}>
            {story.title}
          </h1>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {/* Ім'я автора — посилання на його сторінку. Було звичайним
                текстом: 990 творів не вели на ~50 сторінок авторів, і Google
                не мав чим до них дійти. Сторінка /avtor/[slug] працює і для
                авторів без заведеного профілю (пошук за author_name). */}
            <Link
              href={`/avtor/${authorSlug(story.author_name)}`}
              style={{ fontSize: 15, fontWeight: 700, color: 'var(--r-gold, #ef9f27)', fontFamily: FONT, textDecoration: 'none', borderBottom: '1px solid rgba(239,159,39,0.35)' }}
            >
              {story.author_name}
            </Link>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-dark-muted)', fontFamily: FONT }}>{date}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-dark-muted)', fontFamily: FONT }}>{wordCount} слів · ~{readMin} хв</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(239,159,39,0.4), transparent)', marginBottom: 36 }} />

        {/* Блок гостю (12.09.2026), текст Богдана.
            З 129 дочитувань лише 5 належали акаунтам — решта 124 читали як
            гості з cookie, і жодне з тих прочитань не йде ні в конкурс, ні у
            винагороду авторові за договором, п. 1.5. Увійти нікому не
            пропонували — це перша з трьох точок, де пропонуємо.

            Видимі лише два перші речення: людина прийшла читати, і чотири
            абзаци перед першим рядком історії відсунули б текст на пів
            екрана телефона. Решта — у <details>: закритий, він займає один
            рядок, нічого не зсуває при завантаженні (нуль CLS) і читається
            програмою з екрана без нашої допомоги. Рідний тег, нуль JavaScript.

            ФОРМУЛЮВАННЯ ПРО ОЗВУЧЕННЯ. Написано «проголосуєте за озвучення»,
            а не «його твори озвучать першими». Черга на /cherga залежить від
            голосів усіх читачів, і коштів на запис ще немає — обіцянка
            конкретному читачеві була б невиконанна. Із тієї ж причини
            прочитання (йде авторові в статистику) і бали (йдуть у
            голосування) розведені: це два різні механізми. */}
        {!user && (
          <div style={{
            marginBottom: 28, padding: '13px 16px', borderRadius: 10,
            background: 'rgba(239,159,39,0.09)',
            border: '1px solid rgba(239,159,39,0.24)',
            // Ліва золота смуга — головна підсвітка блока. Дешевша за яскраве
            // тло: помітна краєм ока й не перетягує увагу з тексту історії,
            // яка починається одразу під нею.
            borderLeft: `3px solid ${GOLD}`,
            fontFamily: FONT, fontSize: 13.5, lineHeight: 1.6, color: 'var(--on-dark-muted)',
          }}>
            {/* Акцентів рівно чотири, і вони різної сили: статус (кремовий
                жирний), дія (кнопка), зняття страху (світлий жирний), втрата
                (золоте слово в згортці). Більше виділень означало б, що не
                виділено нічого. */}
            <div style={{ color: '#FFF8EE', fontWeight: 700, fontSize: 14 }}>
              Ви читаєте як гість.
            </div>

            {/* Кнопка, а не посилання в рядку: це головна дія блока, і вона
                має читатися як вказівка, а не як запрошення. Темний текст на
                суцільному золотому — найвищий контраст, який тут можливий. */}
            <a
              href={`/login?next=${encodeURIComponent(`/stories/${id}`)}`}
              style={{
                display: 'inline-block', marginTop: 10,
                background: GOLD, color: '#0a1628',
                fontWeight: 800, fontSize: 13.5, fontFamily: FONT,
                padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
              }}
            >
              Увійдіть через Google за один клік
            </a>

            <div style={{ marginTop: 9, color: '#c8d4e8', fontWeight: 600 }}>
              Безкоштовно, без передплат і прив’язки карти.
            </div>

            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', color: '#c8d4e8', fontSize: 12.5, listStyle: 'revert' }}>
                Що дає акаунт
              </summary>
              <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.75 }}>
                Без акаунта ви <b style={{ color: GOLD }}>втрачаєте</b> історію читання
                й улюблених авторів, накопичувальні бали за читання, знижки та бонуси
                платформи.
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 12.5, lineHeight: 1.75 }}>
                Зареєструйтеся — і ваше{' '}
                <b style={{ color: '#FFF8EE' }}>прочитання зарахують улюбленому авторові</b>,
                а балами ви{' '}
                <a href="/cherga" style={{ color: GOLD }}>проголосуєте за озвучення</a>{' '}
                його творів.
              </p>
            </details>
          </div>
        )}

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

        {/* Реєстраційна стіна СВІДОМО НЕ ПІДКЛЮЧЕНА (рішення Богдана 12.09.2026).
            Компонент готовий і лежить в app/components/StoryWall.tsx, але
            історії лишаються відкритими всі: перші три місяці мета — трафік,
            а стіна людей не приводить, лише фільтрує тих, хто вже прийшов.
            При 574 прочитаннях за весь час фільтрувати нема чого, і замок на
            історіях різав би саме той трафік, що йде з Google Ad Grants.
            Історії — вхід у сайт, серії — комерція; замок стоїть на серіях.
            Вмикати, коли місячні прочитання перевищать півтори тисячі — тоді
            повернути import і рядок:
              {!user && !contestName && <StoryWall slug={id} />} */}

        {/* Облік прочитання — база для винагороди автора. Маркер кінця тексту
            має стояти саме тут, одразу під статтею. */}
        {/* selfRead: автор може перечитувати свій твір скільки завгодно,
            але в облік це не йде — з цих подій рахується його ж винагорода. */}
        <StoryReadTracker contentId={story.id} slug={id} title={story.title} charCount={charCount} selfRead={isOwnAuthor} guest={!user} />
        <ReadingProgressBar />
        <BackToTop />


        {/* Позиція читання: де людина спинилася минулого разу. */}
        <ReadingPosition slug={id} title={story.title} path={`/stories/${id}`} contentId={story.id} />

        {/* Відгук — на місці колишньої кнопки «Подобається».
            Рішення Богдана 09.09.2026: дві кнопки поруч дублювали одну дію
            («сподобалось» і «як тобі?»), а відгук дає більше — оцінку і текст,
            який бачить редакція. Місце найпомітніше на сторінці, тому кнопка
            стоїть першою під текстом. */}
        <ReviewButton
          contentId={story.id}
          contentType="story"
          authorId={story.author_id ?? undefined}
          authorName={story.author_name ?? undefined}
          contentTitle={story.title}
        />

        {/* Збір пошти. Стоїть саме тут — після тексту й лайку, до опитування:
            читач із газети по QR потрапляє одразу сюди, і це єдина точка,
            де його можна втримати. */}
        <StoryEmailCapture slug={id} />

        {/* Три питання тому, хто дочитав */}
        <ReaderPulse contentId={story.id} />

        {/* Що читати далі: твори того самого автора і того самого жанру.
            Раніше під текстом не було жодного посилання на інший твір —
            ні для читача, ні для пошуковика. */}
        <RelatedStories storyId={story.id} authorName={story.author_name} genre={story.genre} />

        {/* Зберегти й поширити — поруч, одразу після тексту й схожих творів. */}
        {/* Зберегти й підписатися — там, де читач щойно дочитав.
            Кнопка стеження досі жила лише на сторінці автора, тобто той,
            кому щойно сподобався твір, мусив здогадатися перейти туди. */}
        <div style={{ marginTop: 40, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <BookmarkButton slug={id} title={story.title} path={`/stories/${id}`} />
          {story.author_id && <FollowAuthorButton authorUserId={story.author_id} />}
          {/* Голос за озвучення саме цього твору. Доти голосувати можна було
              лише через список авторів на /cherga — тобто читач, який щойно
              дочитав, кнопки не бачив, а бали витрачати було нікуди. */}
          <VoiceVoteButton contentId={story.id} />
        </div>

        {/* Поширення */}
        <div style={{ marginTop: 20 }}>
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
