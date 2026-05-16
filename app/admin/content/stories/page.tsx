'use client'

// app/admin/content/stories/page.tsx
// Список УСІХ записів з таблиці content - історії, казки, серії
// Сюди потрапляє "Парочка" та всі інші старі записи без UI
// Дані беремо з публічного /api/stories (вже існує)

import { useState, useEffect } from 'react'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

interface StoryRow {
  id:               string
  title:            string
  author:           string
  coverUrl:         string
  coverPosition:    string
  tags:             string[]
  hasAudio:         boolean
  teaser:           string
  url:              string
  genre?:           string
  duration_minutes?: number
  category?:        string
}

type Phase = 'loading' | 'done' | 'error'

export default function ContentStoriesPage() {
  const [phase,   setPhase]   = useState<Phase>('loading')
  const [error,   setError]   = useState('')
  const [items,   setItems]   = useState<StoryRow[]>([])
  const [search,  setSearch]  = useState('')
  const [filterGenre, setFilterGenre] = useState('all')

  // ── Завантаження ─────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/stories?limit=1000')
      .then(r => r.json())
      .then((data: StoryRow[] | { error: string }) => {
        if ('error' in data) { setError(data.error); setPhase('error'); return }
        setItems(Array.isArray(data) ? data : [])
        setPhase('done')
      })
      .catch(() => { setError("Помилка з'єднання"); setPhase('error') })
  }, [])

  // ── Унікальні жанри для фільтру ──────────────────────────────────
  const allGenres = [...new Set(items.map(s => s.genre).filter(Boolean) as string[])].sort()

  // ── Фільтрація ───────────────────────────────────────────────────
  const filtered = items.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) &&
        !s.author.toLowerCase().includes(search.toLowerCase())) return false
    if (filterGenre !== 'all' && s.genre !== filterGenre) return false
    return true
  })

  // ── Рендер ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', marginBottom: 20, border: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 11, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', fontFamily: FONT }}>Admin · Content</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f5f0e8', marginTop: 4, fontFamily: FONT }}>Усі історії</div>
          {phase === 'done' && (
            <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4, fontFamily: FONT }}>
              {filtered.length} {filtered.length === items.length ? 'записів' : `з ${items.length}`}
            </div>
          )}
        </div>

        {/* Filters */}
        {phase === 'done' && items.length > 0 && (
          <div style={{ background: NAVY, borderRadius: 16, padding: '16px 18px', marginBottom: 20, border: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Пошук за назвою або автором…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: '1 1 200px',
                padding: '8px 12px',
                borderRadius: 8,
                background: NAVY_DEEP,
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f5f0e8',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
              }}
            />
            <select
              value={filterGenre}
              onChange={e => setFilterGenre(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: NAVY_DEEP,
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f5f0e8',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
              }}
            >
              <option value="all">Усі жанри</option>
              {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <div style={{ textAlign: 'center', padding: 40, color: '#8899bb', fontFamily: FONT }}>Завантаження…</div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12, padding: 16, color: '#f87171', fontFamily: FONT }}>
            ⚠ {error}
          </div>
        )}

        {/* Empty */}
        {phase === 'done' && filtered.length === 0 && (
          <div style={{ background: NAVY, borderRadius: 16, padding: 40, textAlign: 'center', color: '#8899bb', fontFamily: FONT, border: '0.5px solid rgba(255,255,255,0.07)' }}>
            {items.length === 0 ? 'Записів немає' : 'Нічого не знайдено за фільтром'}
          </div>
        )}

        {/* List */}
        {phase === 'done' && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => (
              <div
                key={item.id}
                style={{
                  background: NAVY,
                  borderRadius: 12,
                  padding: 14,
                  border: '0.5px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                }}
              >
                {/* Cover thumbnail */}
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  background: `url(${item.coverUrl}) center/cover`,
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.08)',
                }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>{item.author}</span>
                    {item.genre && <span>· {item.genre}</span>}
                    {item.category && <span>· {item.category}</span>}
                  </div>
                </div>

                {/* Edit button */}
                <a
                  href={`/admin/content/stories/${item.id}/edit`}
                  style={{
                    background: GOLD,
                    color: NAVY_DEEP,
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontFamily: FONT,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Редагувати
                </a>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
