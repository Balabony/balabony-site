'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

interface Review {
  id: number
  content_type: string
  content_id: string
  author_id: string | null
  rating: number
  comment: string | null
  user_id: string | null
  created_at: string
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: GOLD, fontSize: 18, letterSpacing: 1 }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminReviewsPage() {
  const router    = useRouter()
  const [reviews,    setReviews]    = useState<Review[]>([])
  const [localRevs,  setLocalRevs]  = useState<Review[]>([])
  const [loading,    setLoading]    = useState(true)
  const [noDb,       setNoDb]       = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'series' | 'story'>('all')
  const [filterAuthor, setFilterAuthor] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const res  = await fetch('/api/reviews')
        const data = await res.json() as { reviews: Review[]; note?: string }
        if (data.note) setNoDb(true)
        setReviews(data.reviews ?? [])
      } catch {
        setNoDb(true)
      }

      try {
        const raw = localStorage.getItem('balabony_reviews') ?? '[]'
        const parsed = JSON.parse(raw) as Array<{
          contentType: string; contentId: string; authorId?: string | null;
          rating: number; comment?: string | null; userId?: string | null; createdAt?: string
        }>
        setLocalRevs(parsed.map((r, i) => ({
          id: -(i + 1),
          content_type: r.contentType,
          content_id:   r.contentId,
          author_id:    r.authorId ?? null,
          rating:       r.rating,
          comment:      r.comment ?? null,
          user_id:      r.userId  ?? null,
          created_at:   r.createdAt ?? new Date().toISOString(),
        })))
      } catch {}

      setLoading(false)
    })()
  }, [])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const allReviews = [...reviews, ...localRevs]
  const filtered   = allReviews.filter(r => {
    if (filterType !== 'all' && r.content_type !== filterType) return false
    if (filterAuthor && r.author_id !== filterAuthor) return false
    return true
  })

  const uniqueAuthors = [...new Set(allReviews.map(r => r.author_id).filter(Boolean))] as string[]

  const avgRating = filtered.length
    ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
    : '—'

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, fontFamily: FONT, padding: '24px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 4 }}>Адмін панель</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f5f0e8' }}>⭐ Відгуки</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => router.push('/admin/stories')}
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 16px', color: '#f5f0e8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
            >
              ← Редактор
            </button>
            <button
              onClick={handleLogout}
              style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 16px', color: '#8899bb', fontSize: 13, cursor: 'pointer', fontFamily: FONT }}
            >
              Вийти
            </button>
          </div>
        </div>

        {/* No DB warning */}
        {noDb && (
          <div style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#f0a500' }}>
            ⚠️ <b>DATABASE_URL не налаштовано</b> — відгуки зберігаються лише локально в браузері. Щоб зберігати відгуки на сервері, додай <code>DATABASE_URL</code> у змінні середовища (Vercel → Settings → Environment Variables).
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Всього відгуків',   value: allReviews.length },
            { label: 'Серій',             value: allReviews.filter(r => r.content_type === 'series').length },
            { label: 'Авторських історій', value: allReviews.filter(r => r.content_type === 'story').length },
            { label: 'Середній рейтинг',  value: avgRating + (avgRating !== '—' ? ' ★' : '') },
          ].map(s => (
            <div key={s.label} style={{ background: NAVY, borderRadius: 12, padding: '14px 20px', border: '0.5px solid rgba(255,255,255,0.07)', minWidth: 140 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['all', 'series', 'story'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                background: filterType === t ? GOLD : 'rgba(255,255,255,0.06)',
                color: filterType === t ? NAVY_DEEP : '#8899bb',
                border: 'none', borderRadius: 8, padding: '7px 16px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              {{ all: 'Всі', series: 'Серії', story: 'Авторські' }[t]}
            </button>
          ))}

          {uniqueAuthors.length > 0 && (
            <select
              value={filterAuthor}
              onChange={e => setFilterAuthor(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 12px', color: '#f5f0e8', fontSize: 13, fontFamily: FONT, cursor: 'pointer' }}
            >
              <option value="">Всі автори</option>
              {uniqueAuthors.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
        </div>

        {/* Reviews list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#8899bb', padding: 40 }}>Завантаження...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8899bb', padding: 40, background: NAVY, borderRadius: 16 }}>
            Відгуків поки немає
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: NAVY, borderRadius: 14, padding: '18px 20px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Stars n={r.rating} />
                    <span style={{ fontSize: 11, fontWeight: 700, background: r.content_type === 'series' ? 'rgba(240,165,0,0.15)' : 'rgba(99,179,237,0.15)', color: r.content_type === 'series' ? GOLD : '#63b3ed', borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {r.content_type === 'series' ? 'Серія' : 'Авторська'}
                    </span>
                    <span style={{ fontSize: 12, color: '#445566' }}>ID: {r.content_id}</span>
                    {r.author_id && <span style={{ fontSize: 12, color: '#445566' }}>Автор: {r.author_id}</span>}
                    {r.id < 0 && <span style={{ fontSize: 11, color: 'rgba(240,165,0,0.5)' }}>локальний</span>}
                  </div>
                  <span style={{ fontSize: 12, color: '#445566' }}>{formatDate(r.created_at)}</span>
                </div>
                {r.comment && (
                  <div style={{ fontSize: 14, color: '#c8d8e8', lineHeight: 1.6, marginTop: 4, paddingLeft: 4 }}>
                    «{r.comment}»
                  </div>
                )}
                {r.user_id && (
                  <div style={{ fontSize: 11, color: '#334455', marginTop: 8 }}>Користувач: {r.user_id}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
