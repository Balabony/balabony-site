'use client'

// Жанри творів.
//
// ШІ читає початок тексту й пропонує жанр із канонічного переліку, показуючи
// впевненість. Зберігає редактор — сам або пакетом. Автоматично, без людини,
// не ставимо: жанр видно читачам і за ним працюють фільтри, а модель
// помиляється саме там, де твір на межі двох жанрів.

import { useCallback, useEffect, useState } from 'react'
import { GENRES } from '@/lib/genres'

const GOLD      = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY      = '#0f1e3a'
const CREAM     = '#f5f0e8'
const MUTED     = '#b9c6db'
const FONT      = "'Montserrat', Arial, sans-serif"
const LINE      = 'rgba(143,163,196,0.22)'

/** Нижче цієї впевненості пропозицію показуємо як сумнівну. */
const SURE_ENOUGH = 70

type Row = {
  id: string
  title: string
  author_name: string | null
  slug: string | null
  genre: string | null
  status: string
}

type Suggestion = { genre: string | null; confidence: number; why: string; error?: string }

export default function GenresPage() {
  const [rows, setRows]         = useState<Row[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [only, setOnly]         = useState<'empty' | 'all'>('empty')
  const [err, setErr]           = useState('')
  const [busy, setBusy]         = useState(false)
  const [note, setNote]         = useState('')
  const [sug, setSug]           = useState<Record<string, Suggestion>>({})
  const [chosen, setChosen]     = useState<Record<string, string>>({})
  const [limit, setLimit]       = useState(50)

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const r = await fetch(`/api/admin/genres?only=${only}&limit=${limit}`)
      if (!r.ok) throw new Error(r.status === 401 ? 'Потрібен вхід в адмінку' : `Помилка ${r.status}`)
      const j = await r.json() as { rows: Row[]; total: number }
      setRows(j.rows); setTotal(j.total)
      setSug({}); setChosen({})
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не вдалось завантажити')
    } finally { setLoading(false) }
  }, [only, limit])

  useEffect(() => { void load() }, [load])

  /** Питаємо модель партіями: так видно поступ і менше ризик обірваного запиту. */
  async function suggest(ids: string[]) {
    if (ids.length === 0) return
    setBusy(true); setNote('')
    try {
      for (let i = 0; i < ids.length; i += 5) {
        const part = ids.slice(i, i + 5)
        const r = await fetch('/api/admin/suggest-genre', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: part }),
        })
        const j = await r.json() as { results?: Array<{ id: string } & Suggestion>; error?: string }
        if (!r.ok) throw new Error(j.error ?? `Помилка ${r.status}`)
        setSug(prev => {
          const next = { ...prev }
          for (const res of j.results ?? []) next[res.id] = res
          return next
        })
        setChosen(prev => {
          const next = { ...prev }
          for (const res of j.results ?? []) if (res.genre) next[res.id] = res.genre
          return next
        })
        setNote(`Опрацьовано ${Math.min(i + 5, ids.length)} із ${ids.length}`)
      }
      setNote('Готово. Перевір і збережи.')
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Не вдалось визначити')
    } finally { setBusy(false) }
  }

  async function saveAll() {
    const items = Object.entries(chosen)
      .filter(([, g]) => g)
      .map(([id, genre]) => ({ id, genre }))
    if (items.length === 0) { setNote('Немає що зберігати'); return }

    setBusy(true); setNote('')
    try {
      const r = await fetch('/api/admin/genres', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const j = await r.json() as { saved?: number; error?: string }
      if (!r.ok) throw new Error(j.error ?? `Помилка ${r.status}`)
      setNote(`Збережено: ${j.saved}`)
      await load()
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Не вдалось зберегти')
    } finally { setBusy(false) }
  }

  const btn: React.CSSProperties = {
    background: 'transparent', color: CREAM, border: `1px solid ${LINE}`,
    borderRadius: 8, padding: '9px 14px', fontSize: 13, fontFamily: FONT, cursor: 'pointer',
  }
  const btnMain: React.CSSProperties = { ...btn, background: GOLD, color: NAVY_DEEP, border: 'none', fontWeight: 700 }

  const pending = Object.values(chosen).filter(Boolean).length

  return (
    <div style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT, minHeight: '100dvh', padding: '22px 16px 120px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Жанри</h1>
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 18px', maxWidth: 720 }}>
          ШІ читає початок твору й пропонує жанр із переліку, показуючи, наскільки впевнений.
          Пропозицію можна змінити в списку поруч. У базу потрапляє лише те, що ви збережете.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
          <select value={only} onChange={e => setOnly(e.target.value as 'empty' | 'all')} style={{ ...btn, background: NAVY }}>
            <option value="empty">Без жанру</option>
            <option value="all">Усі історії</option>
          </select>
          <button
            onClick={() => suggest(rows.map(r => r.id))}
            disabled={busy || rows.length === 0}
            style={{ ...btnMain, opacity: busy || rows.length === 0 ? 0.6 : 1 }}
          >
            {busy ? 'Визначаю…' : `Визначити жанр (${rows.length})`}
          </button>
          <button onClick={saveAll} disabled={busy || pending === 0} style={{ ...btn, opacity: busy || pending === 0 ? 0.5 : 1 }}>
            Зберегти вибране ({pending})
          </button>
          <span style={{ fontSize: 12.5, color: MUTED }}>
            {loading ? 'Завантаження…' : `Показано ${rows.length} із ${total}`}
          </span>
          {!loading && rows.length < total && (
            <button onClick={() => setLimit(l => l + 50)} disabled={busy} style={{ ...btn, opacity: busy ? 0.5 : 1 }}>
              Показати ще 50
            </button>
          )}
        </div>

        {(err || note) && (
          <div style={{
            border: `1px solid ${err ? 'rgba(255,139,139,0.5)' : LINE}`,
            background: err ? 'rgba(255,139,139,0.12)' : 'rgba(185,198,219,0.08)',
            color: err ? '#ffb3b3' : CREAM,
            borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16,
          }}>
            {err || note}
          </div>
        )}

        {!loading && rows.length === 0 && !err && (
          <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', color: MUTED, fontSize: 13.5 }}>
            Творів без жанру немає.
          </div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map(row => {
            const s = sug[row.id]
            const weak = s && s.genre && s.confidence < SURE_ENOUGH
            return (
              <div key={row.id} style={{
                background: NAVY, border: `1px solid ${LINE}`, borderRadius: 12,
                padding: '12px 14px', display: 'grid', gap: 8,
                gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'center',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{row.author_name ?? '—'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{row.title}</div>
                  {row.genre && (
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>зараз: {row.genre}</div>
                  )}
                  {s?.error && (
                    <div style={{ fontSize: 12, color: '#ffb3b3', marginTop: 3 }}>{s.error}</div>
                  )}
                  {s?.genre && (
                    <div style={{ fontSize: 12, color: weak ? '#f0c674' : '#7ddba0', marginTop: 3 }}>
                      {weak ? 'сумнівно' : 'упевнено'} · {s.confidence}%{s.why ? ` · ${s.why}` : ''}
                    </div>
                  )}
                </div>

                <select
                  value={chosen[row.id] ?? ''}
                  onChange={e => setChosen(prev => ({ ...prev, [row.id]: e.target.value }))}
                  style={{ ...btn, background: NAVY, minWidth: 190 }}
                >
                  <option value="">— не міняти —</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
