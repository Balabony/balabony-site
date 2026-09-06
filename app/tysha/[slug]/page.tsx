import { notFound } from 'next/navigation'
import { readingMinutes, countWords } from '@/lib/readingTime'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getAnonUserId } from '@/lib/anon-user'
import type { Metadata } from 'next'
import Link from 'next/link'
import ReadTracker from '@/app/components/ReadTracker'
import StoryReadTracker from '@/app/components/StoryReadTracker'
import ReaderPulse from '@/app/components/ReaderPulse'
import TyshaProgressTracker from '@/app/components/TyshaProgressTracker'
import TyshaAgeGate from '@/app/components/TyshaAgeGate'
import { leadCssDeclarations, fitsLead } from '@/lib/reader-typography'
import { toExcerpt, toPlainText } from '@/lib/plain-text'
import ReaderSettings from '@/app/components/ReaderSettings'

const GOLD = '#ef9f27'
const AMBER = '#FFB347'
const NAVY_DEEP = '#0a1628'
const FONT = "'Montserrat', Arial, sans-serif"
// Базовий кегль тексту серії «Тиші» (сериф Georgia).
const BODY_FONT_SIZE = 17

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Рендер тексту як у Балабонів: сцени (порожній рядок) → абзаци з відступом,
// Справжня мітка персонажа: усі слова з великої літери (плюс приставка «о.»
// для священника), максимум 3 слова. Так нарація з двокрапкою («У школі
// згодом сказали:») НЕ фарбується золотим як ім'я.
function isSpeakerLabel(label: string): boolean {
  const t = label.trim()
  if (!t) return false
  return /^(?:о\.)?[А-ЯІЇЄҐ][а-яіїєґ'ʼ’\-.]*(?:\s+[А-ЯІЇЄҐ][а-яіїєґ'ʼ’\-.]*){0,2}$/.test(t)
}

// репліки «Імʼя:» — імʼя золотим. Розділювачі * * * прибираються.
function formatTyshaText(raw: string): string {
  const cleaned = raw.replace(/^[ \t]*\*[ \t]*\*[ \t]*\*[ \t]*$/gm, '') // прибрати * * *
  const scenes = cleaned.split(/\n{2,}/)
  // Задовгий перший абзац лідом не подаємо — див. LEAD_MAX_CHARS.
  const firstNarrative = (scenes[0] ?? '')
    .split(/\n/)
    .map(x => x.trim())
    .filter(x => x.length > 0)
    .find(x => {
      const m = x.match(/^([^:]{1,40}):\s/)
      return !(m && isSpeakerLabel(m[1]))
    })
  const leadAllowed = firstNarrative !== undefined && fitsLead(firstNarrative)
  const rendered = scenes.map((scene, sceneIdx) => {
    const paragraphs = scene.split(/\n/).filter((p) => p.trim().length > 0)
    if (paragraphs.length === 0) return ''
    const inner = paragraphs.map((p) => {
      const trimmed = p.trim()
      const m = trimmed.match(/^([^:]{1,40}):\s/)
      if (m && isSpeakerLabel(m[1])) {
        const speaker = m[1]
        const rest = trimmed.slice(m[0].length)
        return `<p class="speaker"><strong class="speaker-name" style="color:${GOLD};font-weight:700">${escHtml(speaker)}:</strong> ${escHtml(rest)}</p>`
      }
      // Лід позначаємо класом, а не селектором :first-child: клас читає ще й
      // app/reader.css, і без нього задовгий абзац усе одно ставав би лідом.
      const isLead = leadAllowed && sceneIdx === 0 && trimmed === firstNarrative
      return `<p class="narrative${isLead ? ' lead' : ''}">${escHtml(trimmed)}</p>`
    }).join('')
    return `<div class="scene${sceneIdx === 0 ? ' scene-first' : ''}">${inner}</div>`
  }).join('')
  // Лід: перший абзац нарації більший і світліший. Розмір задано в px, бо
  // .scene p тут уже має свій 17px — відносна одиниця рахувалась би від
  // батька, не від цього значення.
  const styles = `<style>.scene{margin-top:28px}.scene-first{margin-top:0}.scene p{margin:0 0 16px 0;font-size:${BODY_FONT_SIZE}px;line-height:1.75;font-family:'Georgia',serif}.scene p:last-child{margin-bottom:0}${leadAllowed ? `.scene p.lead{${leadCssDeclarations(BODY_FONT_SIZE)}}` : ''}</style>`
  return styles + rendered
}

// Скільки перших серій «Тиші» безкоштовні (далі — підписка).
const FREE_EPISODES = 2

// Тізер для замкненої серії: перші сцени до ~4 абзаців. Решта тексту
// серверно НЕ потрапляє в браузер (на відміну від клієнтського приховування).
function buildTeaser(raw: string, minParagraphs = 4): string {
  const cleaned = raw.replace(/^[ \t]*\*[ \t]*\*[ \t]*\*[ \t]*$/gm, '')
  const scenes = cleaned.split(/\n{2,}/)
  const out: string[] = []
  let collected = 0
  for (const scene of scenes) {
    const paras = scene.split(/\n/).filter((s) => s.trim().length > 0)
    if (paras.length === 0) continue
    out.push(scene)
    collected += paras.length
    if (collected >= minParagraphs) break
  }
  return out.join('\n\n')
}

interface TyshaRow {
  id: string
  slug: string
  title: string
  description: string | null
  season_number: number | null
  episode_number: number | null
  is_premium: boolean | null
  text: string
  corrected_text: string | null
  humanized_text: string | null
  published_version: string | null
  cover_url: string | null
  status: string
  publish_at: string | null
  hook: string | null
  next_teaser: string | null
  audio_url: string | null
  audio_status: string | null
}

// Серія видима, якщо published АБО scheduled із publish_at, що вже настав.
// Адмін бачить будь-яку (включно з draft).
async function getEpisode(slug: string, isAdmin: boolean): Promise<TyshaRow | null> {
  const supabase = getSupabaseAdmin()
  const q = supabase
    .from('content')
    .select('id, slug, title, description, season_number, episode_number, is_premium, text, corrected_text, humanized_text, published_version, cover_url, status, publish_at, hook, next_teaser, audio_url, audio_status')
    .eq('type', 'tysha')
    .eq('slug', slug)

  const { data, error } = await q.single()
  if (error || !data) return null
  const row = data as TyshaRow

  if (isAdmin) return row
  if (row.status === 'published') return row
  if (row.status === 'scheduled' && row.publish_at && new Date(row.publish_at) <= new Date()) return row
  return null
}

async function getNextEpisode(episode: number | null, isAdmin: boolean): Promise<{ slug: string; title: string } | null> {
  if (episode == null) return null
  const supabase = getSupabaseAdmin()
  const nowIso = new Date().toISOString()
  let q = supabase
    .from('content')
    .select('slug, title, status, publish_at')
    .eq('type', 'tysha')
    .gt('episode_number', episode)
    .order('episode_number', { ascending: true })
    .limit(1)
  if (!isAdmin) q = q.or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${nowIso})`)
  const { data } = await q
  if (!data || data.length === 0) return null
  return { slug: data[0].slug as string, title: data[0].title as string }
}

// Recap ПОПЕРЕДНЬОЇ серії — для блоку «Що було раніше».
// На 1-й серії повертає null (нема попередньої) → блок ховається.
async function getPrevTyshaRecap(episode: number | null, isAdmin: boolean): Promise<string | null> {
  if (episode == null) return null
  const supabase = getSupabaseAdmin()
  const nowIso = new Date().toISOString()
  let q = supabase
    .from('content')
    .select('recap, status, publish_at')
    .eq('type', 'tysha')
    .lt('episode_number', episode)
    .order('episode_number', { ascending: false })
    .limit(1)
  if (!isAdmin) q = q.or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${nowIso})`)
  const { data } = await q
  if (!data || data.length === 0) return null
  const recap = (data[0].recap as string | null)?.trim()
  return recap ? recap : null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ep = await getEpisode(slug, false)
  if (!ep) return { title: 'Серію не знайдено' }
  const desc = toExcerpt(ep.hook ?? ep.description ?? ep.text, 160)
  return {
    title: `${ep.title} · ТИША · Балабони`,
    description: desc,
    alternates: { canonical: `/tysha/${slug}` },
    openGraph: { type: 'article', siteName: 'Balabony™', locale: 'uk_UA', title: `${ep.title} · ТИША`, description: desc },
  }
}

export default async function TyshaEpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === process.env.ADMIN_PASSWORD

  const ep = await getEpisode(slug, isAdmin)
  if (!ep) notFound()

  const next = await getNextEpisode(ep.episode_number, isAdmin)
  const body = toPlainText((ep.corrected_text?.trim() ? ep.corrected_text : ep.text) ?? '')

  // ── Пейвол «Тиші».
  // 12.08.2026: раніше тут стояло `locked = !isAdmin && epNum > FREE_EPISODES` —
  // сторінка звірялась ЛИШЕ з номером серії й не дивилась у підписку взагалі.
  // Через це читач, який оплатив пакет, бачив той самий замок, що й гість:
  // гроші взяті, доступу немає. Тепер правило те саме, що в «Балабонах»
  // (app/episodes/[slug]/page.tsx): перші FREE_EPISODES серій — промо для всіх,
  // далі відкриває будь-яка активна підписка, а бонусні серії (is_premium) —
  // лише річний тариф або чинний пільговий статус.
  // Вибору серій (user_free_picks) у «Тиші» немає навмисне: серіал 18+,
  // безкоштовна «вітрина» тут обмежена промо-серіями.
  const epNum = ep.episode_number ?? 0
  const readerId = await getAnonUserId()
  const db = getSupabaseAdmin()

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

  const isPromoEpisode = epNum <= FREE_EPISODES
  const isUnlocked =
    isAdmin ||
    isPromoEpisode ||
    (ep.is_premium ? hasPremiumAccess : hasSub)
  const locked = !isUnlocked
  const visibleBody = locked ? buildTeaser(body) : body
  const prevRecap = await getPrevTyshaRecap(ep.episode_number, isAdmin)

  return (
    <div
      className="reader-root"
      style={{
        minHeight: '100dvh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT,
        // Базові величини саме цієї читалки: кегль 17 і сериф Georgia.
        // Діють, поки читач сам не обрав інший шрифт.
        ['--r-base' as string]: `${BODY_FONT_SIZE}px`,
        ['--r-base-ff' as string]: "'Georgia', serif",
      } as React.CSSProperties}
    >
      <TyshaAgeGate />
      <ReadTracker slug={ep.slug} />
      <TyshaProgressTracker storyId={ep.id} storyTitle={ep.title} locked={locked} />

      {/* Шапка-банер */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 8px' }}>
        {/* Верхній рядок: назад ліворуч, 18+ праворуч — без накладання */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Link href="/" style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.55)', textDecoration: 'none' }}>← На головну</Link>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#e0484d', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>18+</span>
        </div>
        <span style={{ display: 'inline-block', marginTop: 12, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--r-gold, #ef9f27)', background: 'rgba(239,159,39,0.14)', border: '1px solid rgba(239,159,39,0.5)', padding: '4px 9px', borderRadius: 4 }}>
          Авторський серіал
        </span>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '10px 0 5px', lineHeight: 1.2 }}>{ep.title}</h1>
        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 700, color: GOLD }}>Назар Колодій</span>
          <span style={{ color: 'rgba(245,240,232,0.55)', fontStyle: 'italic' }}> · Історія, яку чуєш серцем</span>
        </div>
        {(() => {
          const min = readingMinutes(ep)
          const wc = countWords((ep.published_version === 'humanized' || ep.published_version === 'corrected_humanized') && ep.humanized_text ? ep.humanized_text : ep.published_version === 'corrected' && ep.corrected_text ? ep.corrected_text : ep.text)
          return min ? (
            <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(245,240,232,0.55)', fontFamily: FONT }}>
              {wc} слів · ~{min} хв
            </div>
          ) : null
        })()}
        {isAdmin && ep.status !== 'published' && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#9b8cff', border: '1px solid #9b8cff', borderRadius: 6, padding: '5px 10px', display: 'inline-block' }}>
            попередній перегляд ({ep.status}) — видно лише адміну
          </div>
        )}
      </div>

      {ep.cover_url && (
        <div style={{ position: 'relative', maxWidth: 460, margin: '14px auto 0', aspectRatio: '3 / 4', overflow: 'hidden', borderRadius: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ep.cover_url} alt={ep.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Що було раніше — recap попередньої серії */}
      {prevRecap && (
        <div style={{ maxWidth: 720, margin: '20px auto 0', padding: '0 20px' }}>
          <div style={{ padding: '18px 20px', background: `${GOLD}0f`, border: `1px solid ${GOLD}33`, borderRadius: 12, borderLeft: `3px solid ${GOLD}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              Що було раніше
            </div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: '#d8d2c6', fontStyle: 'italic' }}>
              {prevRecap}
            </p>
          </div>
        </div>
      )}

      {/* Текст серії — формат як у Балабонів. Замкнена серія: тізер + пейвол. */}
      {locked ? (
        <article className="reader-body" style={{ maxWidth: 720, margin: '0 auto', padding: '22px 20px 8px' }}>
          <div style={{ position: 'relative', maxHeight: 460, overflow: 'hidden' }}>
            <div dangerouslySetInnerHTML={{ __html: formatTyshaText(visibleBody) }} />
            <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, background: `linear-gradient(to bottom, transparent, ${NAVY_DEEP})`, pointerEvents: 'none' }} />
          </div>
          <div style={{ marginTop: 24, padding: '32px 24px', borderRadius: 16, background: 'rgba(239,159,39,0.08)', border: `1px solid ${GOLD}44`, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔒</div>
            {/* Читач із місячною підпискою на бонусній серії має бачити не
                «обери пакет» (пакет у нього вже є), а причину замка. */}
            <p style={{ fontSize: 16, color: '#f5f0e8', lineHeight: 1.6, margin: '0 0 6px', fontWeight: 700 }}>
              {ep.is_premium && hasSub ? 'Бонусна серія' : 'Далі — за підпискою'}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(245,240,232,0.7)', lineHeight: 1.6, margin: '0 0 20px' }}>
              {ep.is_premium && hasSub
                ? 'Бонусні серії «Тиші» відкриті для річної передплати та пільгового доступу.'
                : 'Перші дві серії «Тиші» — вільні. Щоб читати серіал далі, обери пакет.'}
            </p>
            <a href="/#pricing" style={{ display: 'inline-block', padding: '14px 28px', background: GOLD, color: NAVY_DEEP, borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', fontFamily: FONT }}>
              {ep.is_premium && hasSub ? 'Перейти на річну →' : 'Обрати пакет →'}
            </a>
          </div>
        </article>
      ) : (
        <article className="reader-body" style={{ maxWidth: 720, margin: '0 auto', padding: '22px 20px 40px' }}>
          <div dangerouslySetInnerHTML={{ __html: formatTyshaText(body) }} />
        </article>
      )}

      {/* Облік прочитань за договором (п. 1.5). Замкнена серія не рахується:
          видно лише тізер. Перші FREE_EPISODES серій відкриті всім з
          рекламною метою — це промо, у винагороду не йде (п. 3.4). */}
      {!locked && (
        <StoryReadTracker
          contentId={ep.id}
          slug={ep.slug}
          title={ep.title}
          charCount={body.length}
          promo={epNum <= FREE_EPISODES}
          analytics={false}
        />
      )}

      {/* Три питання тому, хто дочитав серію цілком */}
      {!locked && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
          <ReaderPulse contentId={ep.id} />
        </div>
      )}

      {/* Наступна серія */}
      {next && !locked && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 48px' }}>
          <Link href={`/tysha/${next.slug}`} id="tysha-next-link" style={{ display: 'block', padding: 16, borderRadius: 12, background: '#0f1e3a', border: `1.5px solid ${AMBER}`, textDecoration: 'none' }}>
            <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', marginBottom: 4 }}>Наступна серія →</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--r-gold, #ef9f27)' }}>{next.title}</div>
            {ep.next_teaser && <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)', marginTop: 6 }}>{ep.next_teaser}</div>}
          </Link>
        </div>
      )}
      {/* Шрифт, розмір літер, день/ніч */}
      <ReaderSettings />
    </div>
  )
}
