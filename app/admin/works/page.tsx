'use client'

// app/admin/works/page.tsx
//
// ЄДИНИЙ КАТАЛОГ ТВОРІВ. 15.09.2026 сюди зведено /admin/content/stories.
//
// Були дві сторінки з тим самим списком. Різниця була одна: «Історії» брали
// дані з публічного /api/stories, який ріже чернетки, а цей розділ бере
// /api/admin/works без фільтра статусу. Тобто відмінність зводилася до одного
// фільтра, а коштувала двох розділів, у яких ще й дії були різні: там
// видалення, тут зміна статусу пачкою. Шукаючи твір, треба було спершу
// згадати, у якому з двох він видимий.
//
// Що звідти перенесено: видалення запису і фільтр за жанром.
// Що свідомо НЕ перенесено: мініатюри обкладинок. Для їх перегляду тепер є
// режим «Ревізія» в /admin/cover-position, де картинка показується цілою і
// великою — на дрібній мініатюрі в списку збою генерації все одно не видно.
//
// /admin/content/stories лишився як перенаправлення сюди, бо на нього
// посилається перемикач у шапці адмінки й збережені закладки. Підсторінка
// /admin/content/stories/[id]/edit жива й далі використовується — саме її
// відкриває кнопка «Відкрити».

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
  const [picked,  setPicked]  = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [genre,   setGenre]   = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      setPicked(new Set())
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

  function toggle(id: string) {
    setPicked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll(list: WorkRow[]) {
    setPicked(prev => (prev.size === list.length ? new Set() : new Set(list.map(w => w.id))))
  }

  async function bulkStatus(next: string) {
    const ids = Array.from(picked)
    if (ids.length === 0) return
    const word = next === 'approved' ? 'Схвалити' : 'Опублікувати'
    if (!window.confirm(`${word} ${ids.length} тв. ?\n\nТексти не будуть вичитані автоматично.`)) return
    setBulkBusy(true)
    try {
      const res = await fetch('/api/admin/works', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Не вдалося оновити')
      setItems(prev => prev.map(w => (picked.has(w.id) ? { ...w, status: next } : w)))
      setPicked(new Set())
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err))
    } finally {
      setBulkBusy(false)
    }
  }

  /**
   * Видалення запису. Перенесено з /admin/content/stories: там це була єдина
   * дія, якої тут бракувало. Роут той самий, що використовувала та сторінка.
   */
  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Видалити «${title || 'без назви'}»?\n\nЦю дію не можна скасувати.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Не вдалося видалити')
      setItems(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err))
    } finally {
      setDeletingId(null)
    }
  }

  // Жанри беремо з того, що вже завантажено: окремий довідник тут зайвий,
  // фільтрувати можна лише те, що видно.
  const genres = Array.from(new Set(items.map(w => w.genre).filter(Boolean) as string[])).sort()
  const shown = genre === 'all' ? items : items.filter(w => w.genre === genre)

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
          <h1 style={{ color: '#fff', fontSize: 28, margin: '6px 0 4px' }}>Каталог творів</h1>
          <div style={{ color: '#8a97b5', fontSize: 14 }}>
            Усі записи, включно з чернетками. Пошук, статуси, видалення.
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
          {genres.length > 0 && (
            <select
              style={{
                padding: '12px 14px', borderRadius: 10, border: '1px solid #24365c',
                background: NAVY_DEEP, color: '#fff', fontSize: 15, fontFamily: FONT,
              }}
              value={genre}
              onChange={e => setGenre(e.target.value)}
            >
              <option value="all">Усі жанри</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
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
            <div style={{
              ...box, marginBottom: 12, display: 'flex', gap: 12,
              alignItems: 'center', flexWrap: 'wrap',
            }}>
              <button
                onClick={() => toggleAll(shown)}
                style={{
                  background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`,
                  borderRadius: 10, padding: '9px 16px', fontSize: 14,
                  cursor: 'pointer', fontFamily: FONT,
                }}
              >
                {picked.size === items.length ? 'Зняти вибір' : 'Обрати всі'}
              </button>

              <span style={{ color: '#7d8aa8', fontSize: 13 }}>
                Знайдено: {items.length}
                {picked.size > 0 ? ` · обрано ${picked.size}` : ''}
              </span>

              <div style={{ flex: 1 }} />

              {picked.size > 0 && (
                <>
                  <button
                    onClick={() => void bulkStatus('approved')}
                    disabled={bulkBusy}
                    style={{
                      background: GOLD, color: NAVY_DEEP, border: 'none',
                      borderRadius: 10, padding: '10px 18px', fontSize: 14,
                      fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                      opacity: bulkBusy ? 0.6 : 1,
                    }}
                  >
                    {bulkBusy ? '…' : `Схвалити (${picked.size})`}
                  </button>
                  <button
                    onClick={() => void bulkStatus('published')}
                    disabled={bulkBusy}
                    style={{
                      background: '#4caf7d', color: NAVY_DEEP, border: 'none',
                      borderRadius: 10, padding: '10px 18px', fontSize: 14,
                      fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
                      opacity: bulkBusy ? 0.6 : 1,
                    }}
                  >
                    {bulkBusy ? '…' : `Опублікувати (${picked.size})`}
                  </button>
                </>
              )}
            </div>
            {shown.map(w => (
              <div key={w.id} style={{ ...box, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <input
                    type="checkbox"
                    checked={picked.has(w.id)}
                    onChange={() => toggle(w.id)}
                    style={{ width: 20, height: 20, marginTop: 4, cursor: 'pointer', accentColor: GOLD }}
                  />
                  <div style={{ flex: '1 1 300px', minWidth: 200 }}>
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

                    <button
                      onClick={() => void handleDelete(w.id, w.title)}
                      disabled={deletingId === w.id}
                      style={{
                        background: 'transparent', color: '#e0484d',
                        border: '1.5px solid rgba(224,72,77,0.6)', borderRadius: 10,
                        padding: '9px 16px', fontSize: 14, fontWeight: 600,
                        fontFamily: FONT, cursor: deletingId === w.id ? 'default' : 'pointer',
                        opacity: deletingId === w.id ? 0.5 : 1,
                      }}
                    >
                      {deletingId === w.id ? 'Видаляю…' : 'Видалити'}
                    </button>
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
