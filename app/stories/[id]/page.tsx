import { notFound } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { Metadata } from 'next'

const GOLD      = '#f0a500'
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
  approved_at:       string
}

async function getStory(id: string): Promise<StoryRow | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, author_name, genre, text, corrected_text, humanized_text, published_version, cover_url, approved_at')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (error || !data) return null
  return data as StoryRow
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const story = await getStory(id)
  if (!story) return { title: 'Історія не знайдена' }
  return {
    title:       `${story.title} — ${story.author_name} | Balabony`,
    description: story.text.replace(/\s+/g, ' ').slice(0, 160),
    openGraph: {
      title:  story.title,
      images: story.cover_url ? [story.cover_url] : [],
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
  const readMin   = Math.ceil(wordCount / 180)
  const date      = new Date(story.approved_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT }}>

      {/* Cover */}
      {story.cover_url && (
        <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.cover_url} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a1628 0%, rgba(10,22,40,0.4) 60%, transparent 100%)' }} />
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: story.cover_url ? '0 20px 80px' : '60px 20px 80px' }}>

        {/* Back link */}
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8899bb', textDecoration: 'none', marginBottom: 28, marginTop: story.cover_url ? 0 : 0, fontFamily: FONT }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2 L4 7 L9 12" stroke="#8899bb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          На головну
        </a>

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
            <span style={{ fontSize: 13, fontWeight: 700, color: GOLD, fontFamily: FONT }}>{story.author_name}</span>
            <span style={{ fontSize: 12, color: '#445566', fontFamily: FONT }}>{date}</span>
            <span style={{ fontSize: 12, color: '#445566', fontFamily: FONT }}>{wordCount} слів · ~{readMin} хв</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(240,165,0,0.4), transparent)', marginBottom: 36 }} />

        {/* Story body */}
        <article
          style={{ fontSize: 16, lineHeight: 1.9, color: '#dde6f0', fontFamily: FONT, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: escapeHtml(body) }}
        />

        {/* Footer */}
        <div style={{ marginTop: 52, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT }}>
            Автор: <strong style={{ color: '#c8d4e8' }}>{story.author_name}</strong>
          </div>
          <a
            href="/"
            style={{ fontSize: 13, fontWeight: 700, color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}44`, borderRadius: 10, padding: '8px 18px', textDecoration: 'none', fontFamily: FONT }}
          >
            Більше історій →
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
