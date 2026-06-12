'use client'

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
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT, flexShrink: 0 }}>{ep}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f5f0e8', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
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
                  {s.audio_status === 'ready' && <span style={{ fontSize: 12 }}>🎧</span>}
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
