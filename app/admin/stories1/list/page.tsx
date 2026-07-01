'use client'

import { useState, useEffect } from 'react'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#d0a355'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

interface StoryRow {
  id:           string
  slug:         string
  title:        string
  author_name:  string
  genre:        string
  category:     string | null
  cover_url:    string | null
  status:       string
  approved_at:  string | null
  word_count:   number
}

type Phase = 'idle' | 'loading' | 'done' | 'error'

export default function StoriesListPage() {
  const [phase,   setPhase]   = useState<Phase>('loading')
  const [error,   setError]   = useState('')
  const [stories, setStories] = useState<StoryRow[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Завантаження списку ───────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/stories1/update', { method: 'GET' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setPhase('error'); return }
        setStories(data.stories ?? [])
        setPhase('done')
      })
      .catch(() => { setError("Помилка з'єднання"); setPhase('error') })
  }, [])

  // ── Видалення ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Видалити історію "${title}"? Цю дію не можна скасувати.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/stories1/update?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) { alert('Помилка: ' + (data.error ?? 'невідома')); setDeletingId(null); return }
      setStories(s => s.filter(x => x.id !== id))
    } catch {
      alert("Помилка з'єднання")
    } finally {
      setDeletingId(null)
    }
  }

  // ── Рендер ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', marginBottom: 20, border: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', fontFamily: FONT }}>Admin · Stories</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f5f0e8', marginTop: 4, fontFamily: FONT }}>Опубліковані історії</div>
            {phase === 'done' && <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4, fontFamily: FONT }}>{stories.length} записів</div>}
          </div>
          <a href="/admin/stories1" style={{ background: GOLD, color: NAVY_DEEP, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: FONT, whiteSpace: 'nowrap' }}>+ Нова історія</a>
        </div>

        {/* Loading */}
        {phase === 'loading' && (
          <div style={{ textAlign: 'center', padding: 40, color: '#8899bb', fontFamily: FONT }}>Завантаження…</div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={{ padding: 16, background: 'rgba(239,68,68,0.09)', borderRadius: 12, color: '#dd8f8f', fontFamily: FONT }}>
            {error}
          </div>
        )}

        {/* List */}
        {phase === 'done' && stories.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#8899bb', fontFamily: FONT }}>Поки що немає опублікованих історій.</div>
        )}

        {phase === 'done' && stories.map(s => (
          <div key={s.id} style={{ background: NAVY, borderRadius: 12, padding: 12, marginBottom: 10, border: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', gap: 12, alignItems: 'center' }}>

            {/* Thumbnail */}
            <div style={{ width: 60, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.05)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.cover_url
                ? <img src={s.cover_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                : <span style={{ fontSize: 22, color: '#445566' }}>📄</span>}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f0e8', marginBottom: 3, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>
                {s.author_name} · {s.genre}{s.category ? ` · ${s.category}` : ''} · {s.word_count} слів
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <a href={`/admin/stories1/edit/${s.id}`} style={{ fontSize: 12, fontWeight: 700, color: GOLD, background: 'rgba(208, 163, 85,0.1)', border: '1px solid rgba(208, 163, 85,0.3)', borderRadius: 8, padding: '6px 12px', textDecoration: 'none', fontFamily: FONT, whiteSpace: 'nowrap' }}>✏️ Редагувати</a>
              <a href={`/stories/${s.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#8899bb', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', textDecoration: 'none', fontFamily: FONT, whiteSpace: 'nowrap' }}>👁</a>
              <button onClick={() => handleDelete(s.id, s.title)} disabled={deletingId === s.id} style={{ fontSize: 12, fontWeight: 700, color: '#dd8f8f', background: 'rgba(221, 143, 143,0.08)', border: '1px solid rgba(221, 143, 143,0.3)', borderRadius: 8, padding: '6px 10px', cursor: deletingId === s.id ? 'wait' : 'pointer', fontFamily: FONT, opacity: deletingId === s.id ? 0.5 : 1 }}>🗑</button>
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
