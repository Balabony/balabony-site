'use client'

import { AudioWaveIcon } from '@/app/components/AudioBadge'
import { useState, useEffect } from 'react'
import type { AnalysisResult } from '@/components/admin/GeminiAnalyzer'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

interface SeriesRow {
  id:             string
  slug:           string
  title:          string
  season_number:  number
  episode_number: number
  created_at:     string
  audio_status:   string | null
  cover_url:      string | null
  analyze_report: AnalysisResult | null
  is_premium:     boolean | null
}

type SortMode = 'newest' | 'oldest' | 'rating-desc' | 'rating-asc'

const controlStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 8,
  background: NAVY, border: '1px solid rgba(255,255,255,0.1)',
  color: '#f5f0e8', fontSize: 13, fontFamily: FONT, outline: 'none',
}

function ratingColor(r: number | null | undefined): string {
  if (r == null) return 'rgba(255,255,255,0.15)'
  if (r >= 8)    return '#2d8f4e'
  if (r >= 6)    return '#d4a017'
  return '#d94545'
}

export default function SeriesListPage() {
  const [series,       setSeries]       = useState<SeriesRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [filterSeason, setFilterSeason] = useState('all')
  const [filterTag,    setFilterTag]    = useState('all')
  const [sortMode,     setSortMode]     = useState<SortMode>('newest')
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [editTitle,    setEditTitle]    = useState('')
  const [savingId,     setSavingId]     = useState<string | null>(null)
  const [covGenSlug,   setCovGenSlug]   = useState<string | null>(null)
  const [coverChar,    setCoverChar]    = useState<'auto' | 'panas' | 'ganya'>('auto')
  // Батч-генерація recap
  const [recapRunning, setRecapRunning] = useState(false)
  const [recapDone,    setRecapDone]    = useState(0)
  const [recapTotal,   setRecapTotal]   = useState(0)
  const [recapLast,    setRecapLast]    = useState('')
  const [recapMsg,     setRecapMsg]     = useState('')

  useEffect(() => {
    fetch('/api/admin/series')
      .then(r => r.json())
      .then((data: { series?: SeriesRow[]; error?: string }) => {
        if (data.error) { setError(data.error); return }
        setSeries(data.series ?? [])
      })
      .catch(() => setError("Помилка з'єднання"))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = (id: string, current: string) => { setEditingId(id); setEditTitle(current) }
  const cancelEdit = () => { setEditingId(null); setEditTitle('') }
  const saveTitle = async (id: string) => {
    const t = editTitle.trim()
    if (!t) return
    setSavingId(id)
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t }),
      })
      if (res.ok) {
        setSeries(prev => prev.map(s => s.id === id ? { ...s, title: t } : s))
        setEditingId(null); setEditTitle('')
      }
    } catch { /* тихо */ } finally {
      setSavingId(null)
    }
  }

  const regenCover = async (slug: string, title: string) => {
    if (covGenSlug) return
    setCovGenSlug(slug)
    try {
      const res = await fetch('/api/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesId: slug, title, description: '', character: coverChar }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (res.ok && data.url) {
        const fresh = `${data.url}${data.url.includes('?') ? '&' : '?'}t=${Date.now()}`
        setSeries(prev => prev.map(s => s.slug === slug ? { ...s, cover_url: fresh } : s))
      }
    } catch { /* тихо */ } finally {
      setCovGenSlug(null)
    }
  }

  // Батч-генерація recap: викликаємо endpoint у циклі, доки done=true.
  // Кожен виклик обробляє один епізод без recap → нема Vercel-timeout, є прогрес.
  const runRecapBatch = async () => {
    if (recapRunning) return
    if (!confirm('Згенерувати recap для всіх епізодів без recap? Уже наявні не змінюються. Це може зайняти кілька хвилин.')) return
    setRecapRunning(true); setRecapDone(0); setRecapTotal(0); setRecapLast(''); setRecapMsg('')
    let safety = 0
    try {
      // doки endpoint каже done=false — продовжуємо
      while (safety < 500) {
        safety++
        const res = await fetch('/api/admin/recap-batch', { method: 'POST' })
        const data = await res.json() as {
          done?: boolean; total?: number; remaining?: number
          processed?: { title?: string; season?: number; episode?: number } | null
          error?: string
        }
        if (!res.ok || data.error) {
          setRecapMsg(`Помилка: ${data.error ?? 'невідома'}. Зупинено. Можна запустити знову — продовжить з місця.`)
          break
        }
        if (data.total) setRecapTotal(data.total)
        if (data.done) {
          setRecapMsg('Готово — усі епізоди мають recap.')
          break
        }
        if (data.processed) {
          setRecapDone(d => d + 1)
          setRecapLast(`S${data.processed.season}E${data.processed.episode} · ${data.processed.title ?? ''}`)
        }
      }
    } catch {
      setRecapMsg("Помилка з'єднання. Зупинено. Можна запустити знову — продовжить з місця.")
    } finally {
      setRecapRunning(false)
    }
  }

  const allSeasons = [...new Set(series.map(s => s.season_number))].sort((a, b) => a - b)
  const allTags    = [...new Set(series.flatMap(s => s.analyze_report?.tags ?? []))].sort()

  const filteredAndSorted = series
    .filter(s => {
      if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterSeason !== 'all' && String(s.season_number) !== filterSeason) return false
      if (filterTag !== 'all' && !(s.analyze_report?.tags ?? []).includes(filterTag)) return false
      return true
    })
    .sort((a, b) => {
      if (sortMode === 'newest') {
        return b.season_number !== a.season_number
          ? b.season_number - a.season_number
          : b.episode_number - a.episode_number
      }
      if (sortMode === 'oldest') {
        return a.season_number !== b.season_number
          ? a.season_number - b.season_number
          : a.episode_number - b.episode_number
      }
      const ra = a.analyze_report?.rating ?? -1
      const rb = b.analyze_report?.rating ?? -1
      if (sortMode === 'rating-desc') return rb - ra
      return ra - rb
    })

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Батч-генерація recap */}
        <div style={{ marginBottom: 20, padding: 14, background: NAVY, borderRadius: 12, border: '1px solid rgba(240,165,0,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={runRecapBatch}
              disabled={recapRunning}
              style={{
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                color: '#1a1205', background: GOLD, border: 'none',
                borderRadius: 8, padding: '9px 16px',
                cursor: recapRunning ? 'default' : 'pointer', opacity: recapRunning ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {recapRunning ? '⏳ Генерую recap…' : '✨ Згенерувати всі recap'}
            </button>
            <span style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>
              Тільки для епізодів без recap. Наявні не змінюються.
            </span>
          </div>
          {(recapRunning || recapDone > 0 || recapMsg) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1', fontFamily: FONT, lineHeight: 1.6 }}>
              {recapDone > 0 && <div>Згенеровано цього запуску: <b style={{ color: GOLD }}>{recapDone}</b>{recapTotal ? ` (усього епізодів: ${recapTotal})` : ''}</div>}
              {recapLast && <div style={{ color: '#8899bb' }}>Останній: {recapLast}</div>}
              {recapMsg && <div style={{ color: recapMsg.startsWith('Помилка') ? '#f87171' : '#9ae6b4' }}>{recapMsg}</div>}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            style={{ ...controlStyle, flex: '2 1 180px' }}
            placeholder="Пошук за назвою..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={{ ...controlStyle, flex: '1 1 130px', cursor: 'pointer' }} value={filterSeason} onChange={e => setFilterSeason(e.target.value)}>
            <option value="all">Усі сезони</option>
            {allSeasons.map(s => <option key={s} value={String(s)}>Сезон {s}</option>)}
          </select>
          <select style={{ ...controlStyle, flex: '1 1 130px', cursor: 'pointer' }} value={filterTag} onChange={e => setFilterTag(e.target.value)}>
            <option value="all">Усі теги</option>
            {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
          </select>
          <select style={{ ...controlStyle, flex: '1 1 150px', cursor: 'pointer' }} value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}>
            <option value="newest">Новіші зверху</option>
            <option value="oldest">Старіші зверху</option>
            <option value="rating-desc">Рейтинг ↓</option>
            <option value="rating-asc">Рейтинг ↑</option>
          </select>
          <select
            style={{ ...controlStyle, flex: '1 1 160px', cursor: 'pointer' }}
            value={coverChar}
            onChange={e => setCoverChar(e.target.value as 'auto' | 'panas' | 'ganya')}
            title="Хто на обкладинці при перегенерації"
          >
            <option value="auto">Герой: авто</option>
            <option value="panas">Герой: Панас</option>
            <option value="ganya">Герой: Ганя</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 14, color: '#445566', fontFamily: FONT }}>
            Завантаження...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontSize: 13, color: '#f87171', fontFamily: FONT }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredAndSorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 14, color: '#445566', fontFamily: FONT }}>
            Серій не знайдено
          </div>
        )}

        {/* Series list */}
        {!loading && !error && filteredAndSorted.map(s => {
          const rating = s.analyze_report?.rating ?? null
          const tags   = (s.analyze_report?.tags ?? []).slice(0, 3)
          const ep     = `S${s.season_number}E${String(s.episode_number).padStart(2, '0')}`
          const date   = new Date(s.created_at).toLocaleDateString('uk-UA')

          return (
            <div key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: NAVY, borderRadius: 12, marginBottom: 8 }}>

              {/* Cover */}
              {s.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.cover_url}
                  alt={s.title}
                  style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 8, background: NAVY_DEEP, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#334455', flexShrink: 0 }}>
                  —
                </div>
              )}

              {/* Main area */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Row 1: episode label + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT, flexShrink: 0 }}>{ep}</span>
                  {editingId === s.id ? (
                    <>
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveTitle(s.id); if (e.key === 'Escape') cancelEdit() }}
                        style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: '#f5f0e8', fontFamily: FONT, background: 'rgba(0,0,0,0.3)', border: `1px solid ${GOLD}`, borderRadius: 6, padding: '4px 8px', outline: 'none' }}
                      />
                      <button type="button" onClick={() => saveTitle(s.id)} disabled={savingId === s.id}
                        style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#1a1205', background: GOLD, border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT }}>
                        {savingId === s.id ? '…' : 'Зберегти'}
                      </button>
                      <button type="button" onClick={cancelEdit}
                        style={{ flexShrink: 0, fontSize: 14, color: '#8899bb', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#f5f0e8', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                      <button type="button" onClick={() => startEdit(s.id, s.title)} title="Редагувати назву"
                        style={{ flexShrink: 0, fontSize: 13, color: '#8899bb', background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}>✎</button>
                      {s.is_premium && (
                        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: GOLD, background: `${GOLD}1a`, border: `1px solid ${GOLD}55`, borderRadius: 12, padding: '2px 8px', fontFamily: FONT, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>🔒 Тільки річні</span>
                      )}
                    </>
                  )}
                </div>
                {/* Row 2: tags */}
                {tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tags.map(tag => (
                      <span key={tag} style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: 'rgba(255,255,255,0.06)', color: '#8899bb', fontFamily: FONT }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Row 3: date + audio badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>{date}</span>
                  {s.audio_status === 'ready' && <AudioWaveIcon size={14} color="#EF9F27" />}
                </div>
              </div>

              {/* Rating badge */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: ratingColor(rating),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: rating != null ? 13 : 14, fontWeight: 700,
                color: rating != null ? '#fff' : '#445566',
                fontFamily: FONT,
              }}>
                {rating ?? '—'}
              </div>

              {/* Regenerate cover */}
              <button
                type="button"
                onClick={() => regenCover(s.slug, s.title)}
                disabled={covGenSlug === s.slug}
                title="Перегенерувати обкладинку (~60–90 с)"
                style={{
                  flexShrink: 0, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', color: covGenSlug === s.slug ? '#caa24a' : '#B5D4F4',
                  border: '1px solid rgba(255,255,255,0.12)', fontFamily: FONT,
                  fontSize: 12, fontWeight: 700, cursor: covGenSlug === s.slug ? 'default' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {covGenSlug === s.slug ? '⏳ Малюю…' : '🔄 Обкладинка'}
              </button>

              {/* Edit link */}
              <a
                href={`/admin/content/stories/${s.id}/edit`}
                style={{
                  flexShrink: 0, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(240,165,0,0.12)', color: GOLD,
                  border: '1px solid rgba(240,165,0,0.3)', fontFamily: FONT,
                  fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                Редагувати
              </a>

            </div>
          )
        })}

      </div>
    </div>
  )
}
