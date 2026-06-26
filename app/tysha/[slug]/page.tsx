import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { Metadata } from 'next'
import Link from 'next/link'
import ReadTracker from '@/app/components/ReadTracker'

const GOLD = '#ef9f27'
const AMBER = '#FFB347'
const NAVY_DEEP = '#0a1628'
const FONT = "'Montserrat', Arial, sans-serif"

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Рендер тексту як у Балабонів: сцени (порожній рядок) → абзаци з відступом,
// репліки «Імʼя:» — імʼя золотим. Розділювачі * * * прибираються.
function formatTyshaText(raw: string): string {
  const cleaned = raw.replace(/^[ \t]*\*[ \t]*\*[ \t]*\*[ \t]*$/gm, '') // прибрати * * *
  const scenes = cleaned.split(/\n{2,}/)
  const rendered = scenes.map((scene, sceneIdx) => {
    const paragraphs = scene.split(/\n/).filter((p) => p.trim().length > 0)
    if (paragraphs.length === 0) return ''
    const inner = paragraphs.map((p) => {
      const trimmed = p.trim()
      const m = trimmed.match(/^([^:]{1,40}):\s/)
      if (m) {
        const speaker = m[1]
        const rest = trimmed.slice(m[0].length)
        return `<p class="speaker"><strong style="color:${GOLD};font-weight:700">${escHtml(speaker)}:</strong> ${escHtml(rest)}</p>`
      }
      return `<p class="narrative">${escHtml(trimmed)}</p>`
    }).join('')
    return `<div class="scene${sceneIdx === 0 ? ' scene-first' : ''}">${inner}</div>`
  }).join('')
  const styles = `<style>.scene{margin-top:28px}.scene-first{margin-top:0}.scene p{margin:0 0 16px 0;font-size:17px;line-height:1.75;font-family:'Georgia',serif}.scene p:last-child{margin-bottom:0}</style>`
  return styles + rendered
}

interface TyshaRow {
  id: string
  slug: string
  title: string
  description: string | null
  season_number: number | null
  episode_number: number | null
  text: string
  corrected_text: string | null
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
    .select('id, slug, title, description, season_number, episode_number, text, corrected_text, cover_url, status, publish_at, hook, next_teaser, audio_url, audio_status')
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ep = await getEpisode(slug, false)
  if (!ep) return { title: 'Серію не знайдено' }
  const desc = (ep.hook ?? ep.description ?? ep.text.replace(/\s+/g, ' ')).trim().slice(0, 160)
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
  const body = (ep.corrected_text?.trim() ? ep.corrected_text : ep.text) ?? ''

  return (
    <div style={{ minHeight: '100dvh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT }}>
      <ReadTracker slug={ep.slug} />

      {/* Шапка-банер */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 8px' }}>
        <Link href="/" style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.55)', textDecoration: 'none' }}>← На головну</Link>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, background: 'rgba(239,159,39,0.14)', border: '1px solid rgba(239,159,39,0.5)', padding: '4px 9px', borderRadius: 4 }}>
            Авторський серіал
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#e0484d', padding: '3px 8px', borderRadius: 6 }}>18+</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '14px 0 4px', lineHeight: 1.2 }}>{ep.title}</h1>
        <div style={{ fontSize: 12.5, fontStyle: 'italic', color: GOLD }}>Історія, яку чуєш серцем · Назар Колодій</div>
        {isAdmin && ep.status !== 'published' && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#9b8cff', border: '1px solid #9b8cff', borderRadius: 6, padding: '5px 10px', display: 'inline-block' }}>
            попередній перегляд ({ep.status}) — видно лише адміну
          </div>
        )}
      </div>

      {ep.cover_url && (
        <div style={{ position: 'relative', maxWidth: 720, margin: '14px auto 0', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ep.cover_url} alt={ep.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Текст серії — формат як у Балабонів */}
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '22px 20px 40px' }}>
        <div dangerouslySetInnerHTML={{ __html: formatTyshaText(body) }} />
      </article>

      {/* Наступна серія */}
      {next && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 48px' }}>
          <Link href={`/tysha/${next.slug}`} style={{ display: 'block', padding: 16, borderRadius: 12, background: '#0f1e3a', border: `1.5px solid ${AMBER}`, textDecoration: 'none' }}>
            <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', marginBottom: 4 }}>Наступна серія →</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{next.title}</div>
            {ep.next_teaser && <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)', marginTop: 6 }}>{ep.next_teaser}</div>}
          </Link>
        </div>
      )}
    </div>
  )
}
