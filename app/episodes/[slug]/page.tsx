import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { Metadata } from 'next'
import EpisodePaywall from './EpisodePaywall'
import ReportErrorWidget from '@/app/components/ReportErrorWidget'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import ShareButtons from '@/app/components/ShareButtons'
import EpisodeCliffhanger from '@/app/components/EpisodeCliffhanger'

const GOLD      = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const FONT      = "'Montserrat', Arial, sans-serif"

interface EpisodeRow {
  id:                string
  slug:              string
  title:             string
  description:       string | null
  season_number:     number
  episode_number:    number
  text:              string
  corrected_text:    string | null
  humanized_text:    string | null
  published_version: string | null
  cover_url:         string | null
  approved_at:       string
  hook:              string | null
  next_teaser:       string | null
  next_release_date: string | null
}

async function getEpisode(slug: string): Promise<EpisodeRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('id, slug, title, description, season_number, episode_number, text, corrected_text, humanized_text, published_version, cover_url, approved_at, hook, next_teaser, next_release_date')
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const episode = await getEpisode(slug)
  if (!episode) return { title: 'Епізод не знайдено' }
  return {
    title:       `${episode.title} · Балабони`,
    description: episode.description ?? episode.text.replace(/\s+/g, ' ').slice(0, 160),
    openGraph: {
      title:  episode.title,
      images: episode.cover_url ? [episode.cover_url] : [],
    },
    alternates: { canonical: `/episodes/${slug}` },
  }
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const episode = await getEpisode(slug)
  if (!episode) notFound()

  const nextEp = await getNextEpisode(episode.season_number, episode.episode_number)

  const v    = episode.published_version ?? 'original'
  const body = (v === 'humanized' || v === 'corrected_humanized') && episode.humanized_text
    ? episode.humanized_text
    : v === 'corrected' && episode.corrected_text
      ? episode.corrected_text
      : episode.text

  const wordCount = body.trim().split(/\s+/).length
  const readMin   = Math.ceil(wordCount / 180)
  const date      = episode.approved_at
    ? new Date(episode.approved_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT }}>

      {episode.cover_url && (
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', aspectRatio: '1 / 1', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={episode.cover_url} alt={episode.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: GOLD, fontFamily: FONT }}>Балабони</span>
            {date && <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-dark-muted)', fontFamily: FONT }}>{date}</span>}
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-dark-muted)', fontFamily: FONT }}>{wordCount} слів · ~{readMin} хв</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(239,159,39,0.4), transparent)', marginBottom: 36 }} />

        <EpisodePaywall html={formatEpisodeText(body)} fontFamily={FONT} seasonNumber={episode.season_number} episodeNumber={episode.episode_number} />

        <div style={{ marginTop: 40 }}>
          <ShareButtons url={`https://balabony.com/episodes/${slug}`} title={episode.title} />
        </div>

        {(episode.hook || episode.next_teaser || nextEp) && (
          <div style={{ marginTop: 44, marginLeft: -20, marginRight: -20 }}>
            <EpisodeCliffhanger
              hook={episode.hook ?? undefined}
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

        <div style={{ marginTop: 52, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--on-dark-muted)', fontFamily: FONT }}>
            Сезон {episode.season_number} · Серія {episode.episode_number}
          </div>
          <a href="/" style={{ fontSize: 13, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 10, padding: '8px 18px', textDecoration: 'none', fontFamily: FONT }}>Більше епізодів →</a>
        </div>

      </div>

      <ReportErrorWidget />
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
  const styles = `<style>.scene{margin-top:28px}.scene-first{margin-top:0}.scene p{margin:0 0 14px 0}.scene p:last-child{margin-bottom:0}.speaker{padding-left:0}.narrative{}</style>`
  return styles + renderedScenes
}