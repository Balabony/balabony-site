import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { Metadata } from 'next'
import EpisodeBody from './EpisodeBody'

const GOLD      = '#f0a500'
const NAVY_DEEP = '#0a1628'
const NAVY      = '#0f1e3a'
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
}

async function getEpisode(slug: string): Promise<EpisodeRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('content')
    .select('id, slug, title, description, season_number, episode_number, text, corrected_text, humanized_text, published_version, cover_url, approved_at')
    .eq('type', 'balabony')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return data as EpisodeRow
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
  }
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const episode = await getEpisode(slug)
  if (!episode) notFound()

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

      {/* Cover */}
      {episode.cover_url && (
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', aspectRatio: '1 / 1', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={episode.cover_url} alt={episode.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a1628 0%, rgba(10,22,40,0.4) 60%, transparent 100%)' }} />
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: episode.cover_url ? '0 20px 80px' : '60px 20px 80px' }}>

        {/* Back link */}
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8899bb', textDecoration: 'none', marginBottom: 28, fontFamily: FONT }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2 L4 7 L9 12" stroke="#8899bb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          На головну
        </a>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          {/* Season/episode tag */}
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 20, padding: '3px 10px', textTransform: 'capitalize', fontFamily: FONT, letterSpacing: 0.4 }}>
            Сезон {episode.season_number} · Серія {episode.episode_number}
          </span>

          {/* Title */}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f5f0e8', lineHeight: 1.25, margin: '14px 0 10px', fontFamily: FONT }}>
            {episode.title}
          </h1>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: GOLD, fontFamily: FONT }}>Балабони</span>
            {date && <span style={{ fontSize: 12, color: '#445566', fontFamily: FONT }}>{date}</span>}
            <span style={{ fontSize: 12, color: '#445566', fontFamily: FONT }}>{wordCount} слів · ~{readMin} хв</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(240,165,0,0.4), transparent)', marginBottom: 36 }} />

        {/* Episode body */}
        <EpisodeBody html={escapeHtml(body)} fontFamily={FONT} />

        {/* Footer */}
        <div style={{ marginTop: 52, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT }}>
            Сезон {episode.season_number} · Серія {episode.episode_number}
          </div>
          <a
            href="/"
            style={{ fontSize: 13, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 10, padding: '8px 18px', textDecoration: 'none', fontFamily: FONT }}
          >
            Більше епізодів →
          </a>
        </div>

      </div>
    </div>
  )
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>')
}
