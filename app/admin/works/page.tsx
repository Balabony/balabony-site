'use client'

// app/admin/works/page.tsx
// Пошук по УСІХ творах, включно з чернетками (draft).
// /admin/content/stories бере дані з публічного /api/stories, який ріже draft —
// тому там видно лише approved. Ця сторінка показує все.

import { useState, useEffect, useCallback } from 'react'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#d0a355'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

interface WorkRow {
  id:           string
  title:        string
  author_name:  string | null
  status:       string
  type:         string | null
  genre:        string | null
  created_at:   string | null
}

type Phase = 'idle' | 'loading' | 'done' | 'error'

const STATUS_LABELS: Record<string, string> = {
  draft:     'Чернетка',
  approved:  'Схвалено',
  published: 'Опубліковано',
}

const STATUS_COLORS: Record<string, string> = {
  draft:     '#8a8fa3',
  approved:  '#d0a355',
  published: '#4caf7d',
}

export default function AdminWorksPage() {
  const [phase,   setPhase]   = useState<Phase>('idle')
  const [error,   setError]   = useState('')
  const [items,   setItems]   = useState<WorkRow[]>([])
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('all')
  const [busyId,  setBusyId]  = useState<string | null>(null)
  const [ready,   setReady]   = useState(false)

  // Читаємо ?q= та ?status= з адреси, щоб лінки можна було зберігати в закладках
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const q0 = sp.get('q')
    const st0 = sp.get('status')
    if (q0) setSearch(q0)
    if (st0 && ['all', 'draft', 'approved', 'published'].includes(st0)) setStatus(st0)
    setReady(true)
  }, [])

  const load = useCallback(async (q: string, st: string) => {
    setPhase('loading')
    setError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      params.set('status', st)
      params.set('limit', '200')
      const res = await fetch(`/api/admin/works?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка запиту')
      setItems(Array.isArray(data.items) ? data.items : [])
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      void load(search, status)
      const sp = new URLSearchParams()
      if (search) sp.set('q', search)
      if (status !== 'all') sp.set('status', status)
      const qs = sp.toString()
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
    }, 350)
    return () => clearTimeout(t)
  }, [search, status, load, ready])

  async function changeStatus(id: string, next: string) {
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/works', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Не вдалося змінити статус')
      setItems(prev => prev.map(w => (w.id === id ? { ...w, status: next } : w)))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  const box: React.CSSProperties = {
    background: NAVY,
    borderRadius: 14,
    padding: '18px 22px',
    marginBottom: 16,
  }

  return (
    <div style={{ fontFamily: FONT, background: NAVY_DEEP, minHeight: '80vh', padding: '28px 16px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        <div style={box}>
          <div style={{ color: '#7d8aa8', fontSize: 12, letterSpacing: 1.4 }}>ADMIN · WORKS</div>
          <h1 style={{ color: '#fff', fontSize: 28, margin: '6px 0 4px' }}>Пошук творів</h1>
          <div style={{ color: '#8a97b5', fontSize: 14 }}>
            Показує всі записи, зокрема чернетки, яких немає в інших розділах.
          </div>
        </div>

        <div style={{ ...box, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            style={{
              flex: '1 1 320px', minWidth: 220, padding: '12px 14px',
              borderRadius: 10, border: '1px solid #24365c',
              background: NAVY_DEEP, color: '#fff', fontSize: 15, fontFamily: FONT,
            }}
            placeholder="Назва або автор…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            style={{
              padding: '12px 14px', borderRadius: 10, border: '1px solid #24365c',
              background: NAVY_DEEP, color: '#fff', fontSize: 15, fontFamily: FONT,
            }}
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="all">Усі статуси</option>
            <option value="draft">Чернетки</option>
            <option value="approved">Схвалено</option>
            <option value="published">Опубліковано</option>
          </select>
        </div>

        {phase === 'loading' && (
          <div style={{ ...box, textAlign: 'center', color: '#8a97b5' }}>Шукаю…</div>
        )}

        {phase === 'error' && (
          <div style={{ ...box, color: '#ff9d9d' }}>{error}</div>
        )}

        {phase === 'done' && items.length === 0 && (
          <div style={{ ...box, textAlign: 'center', color: '#8a97b5' }}>
            Нічого не знайдено
          </div>
        )}

        {phase === 'done' && items.length > 0 && (
          <>
            <div style={{ color: '#7d8aa8', fontSize: 13, margin: '0 0 10px 6px' }}>
              Знайдено: {items.length}
            </div>
            {items.map(w => (
              <div key={w.id} style={{ ...box, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 340px', minWidth: 220 }}>
                    <div style={{ color: '#fff', fontSize: 17, fontWeight: 600 }}>
                      {w.title || '(без назви)'}
                    </div>
                    <div style={{ color: '#8a97b5', fontSize: 14, marginTop: 4 }}>
                      {w.author_name || 'автор не вказаний'}
                      {w.type ? ` · ${w.type}` : ''}
                      {w.genre ? ` · ${w.genre}` : ''}
                    </div>
                    <div style={{ color: '#5d6b8a', fontSize: 12, marginTop: 4 }}>
                      {w.id}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      color: STATUS_COLORS[w.status] || '#8a97b5',
                      border: `1px solid ${STATUS_COLORS[w.status] || '#8a97b5'}`,
                      borderRadius: 20, padding: '4px 12px', fontSize: 13,
                    }}>
                      {STATUS_LABELS[w.status] || w.status}
                    </span>

                    {w.status === 'draft' && (
                      <button
                        onClick={() => void changeStatus(w.id, 'approved')}
                        disabled={busyId === w.id}
                        style={{
                          background: GOLD, color: NAVY_DEEP, border: 'none',
                          borderRadius: 10, padding: '10px 16px', fontSize: 14,
                          fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                          opacity: busyId === w.id ? 0.6 : 1,
                        }}
                      >
                        {busyId === w.id ? '…' : 'Схвалити'}
                      </button>
                    )}

                    {w.status === 'approved' && (
                      <button
                        onClick={() => void changeStatus(w.id, 'published')}
                        disabled={busyId === w.id}
                        style={{
                          background: '#4caf7d', color: NAVY_DEEP, border: 'none',
                          borderRadius: 10, padding: '10px 16px', fontSize: 14,
                          fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                          opacity: busyId === w.id ? 0.6 : 1,
                        }}
                      >
                        {busyId === w.id ? '…' : 'Опублікувати'}
                      </button>
                    )}

                    <a
                      href={`/admin/content/stories/${w.id}/edit`}
                      style={{
                        color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 10,
                        padding: '9px 16px', fontSize: 14, textDecoration: 'none',
                      }}
                    >
                      Відкрити
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
