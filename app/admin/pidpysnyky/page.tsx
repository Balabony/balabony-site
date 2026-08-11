'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'

/**
 * /admin/pidpysnyky — база пошт, зібрана блоком під історіями.
 *
 * Дві речі, які має показувати сторінка:
 *   1. скільки адрес є і як швидко вони додаються;
 *   2. з яких саме текстів люди підписуються — це підказка, що ставити
 *      в наступний номер газети.
 *
 * Експорт у CSV потрібен для завантаження в сервіс розсилки, поки власної
 * відправки немає.
 */

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"

interface Sub { [k: string]: unknown; email?: string; source?: string | null; created_at?: string; consent?: boolean | null; unsubscribed_at?: string | null }
interface Cat { slug: string; title: string }
interface Data { subs: Sub[]; catalog: Cat[]; errors?: Record<string, string | null> }

function fmt(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function SubscribersPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscribers-data')
      if (res.status === 401) { setError('Потрібен вхід в адмінку'); setLoading(false); return }
      setData(await res.json() as Data)
      setError('')
    } catch {
      setError('Не вдалося завантажити')
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const titleBySlug = useMemo(() => {
    const m = new Map<string, string>()
    ;(data?.catalog ?? []).forEach(c => m.set(c.slug, c.title))
    return m
  }, [data])

  /** Джерело у людському вигляді: story:slug → назва історії. */
  const sourceLabel = useCallback((src?: string | null) => {
    if (!src) return '—'
    if (src.startsWith('story:')) {
      const slug = src.slice(6)
      return titleBySlug.get(slug) ?? slug
    }
    if (src === 'homepage') return 'головна сторінка'
    return src
  }, [titleBySlug])

  const subs = useMemo(() => {
    const all = data?.subs ?? []
    if (!filter.trim()) return all
    const q = filter.trim().toLowerCase()
    return all.filter(s =>
      String(s.email ?? '').toLowerCase().includes(q) ||
      sourceLabel(s.source as string).toLowerCase().includes(q)
    )
  }, [data, filter, sourceLabel])

  /** Скільки додалось за тиждень і за місяць. */
  const stats = useMemo(() => {
    const all = data?.subs ?? []
    const now = Date.now()
    const week = all.filter(s => s.created_at && now - new Date(s.created_at).getTime() < 7 * 864e5).length
    const month = all.filter(s => s.created_at && now - new Date(s.created_at).getTime() < 30 * 864e5).length
    const off = all.filter(s => s.unsubscribed_at).length
    return { total: all.length, week, month, off }
  }, [data])

  /** З яких текстів приходять підписки. */
  const bySource = useMemo(() => {
    const m = new Map<string, number>()
    ;(data?.subs ?? []).forEach(s => {
      const k = sourceLabel(s.source as string)
      m.set(k, (m.get(k) ?? 0) + 1)
    })
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  }, [data, sourceLabel])

  const exportCsv = () => {
    const rows = [['email', 'source', 'created_at']]
    subs.forEach(s => rows.push([
      String(s.email ?? ''),
      sourceLabel(s.source as string),
      String(s.created_at ?? ''),
    ]))
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    // BOM — щоб Excel не поламав кирилицю
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pidpysnyky_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div style={S.wrap}><p style={S.muted}>Завантаження…</p></div>

  return (
    <div style={S.wrap}>
      <h1 style={S.h1}>Підписники</h1>
      <p style={S.muted}>
        Пошти, зібрані блоком під історіями. Колонка «Звідки» показує, з якого
        тексту людина підписалась — це підказка, що ставити в наступний номер.
      </p>

      {error && <div style={S.err}>{error}</div>}

      <div style={S.cards}>
        <Card label="Усього адрес" value={stats.total} />
        <Card label="За тиждень" value={stats.week} />
        <Card label="За місяць" value={stats.month} />
        <Card label="Відписалось" value={stats.off} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Пошук за поштою або назвою історії"
          style={{ ...S.input, flex: '1 1 260px' }}
        />
        <button type="button" onClick={exportCsv} style={S.btn}>
          Вивантажити CSV
        </button>
      </div>

      {bySource.length > 0 && (
        <>
          <h2 style={S.h2}>Звідки приходять</h2>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Джерело</th>
                <th style={S.th}>Підписок</th>
              </tr>
            </thead>
            <tbody>
              {bySource.map(([src, n]) => (
                <tr key={src}>
                  <td style={S.td}>{src}</td>
                  <td style={S.tdNum}>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 style={S.h2}>Список {filter && `(знайдено ${subs.length})`}</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Дата</th>
            <th style={S.th}>Пошта</th>
            <th style={S.th}>Звідки</th>
            <th style={S.th}>Стан</th>
          </tr>
        </thead>
        <tbody>
          {subs.length === 0 && (
            <tr><td colSpan={4} style={S.td}>Підписників ще немає</td></tr>
          )}
          {subs.slice(0, 500).map((s, i) => (
            <tr key={String(s.email) + i}>
              <td style={S.td}>{fmt(s.created_at)}</td>
              <td style={S.td}>{String(s.email ?? '')}</td>
              <td style={S.td}>{sourceLabel(s.source as string)}</td>
              <td style={S.td}>
                {s.unsubscribed_at
                  ? <span style={{ color: '#94a3b8' }}>відписався</span>
                  : <span style={{ color: '#22c55e' }}>активний</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {subs.length > 500 && (
        <p style={{ ...S.muted, marginTop: 12 }}>
          Показано перші 500. Повний список — у вивантаженні CSV.
        </p>
      )}

      <div style={S.note}>
        <b>Ці люди чекають на листи.</b> Блок під історією обіцяє нову серію
        щовівторка і щоп&apos;ятниці. Поки власної розсилки немає, вивантажуйте
        CSV і надсилайте через сервіс. Якщо між підпискою і першим листом мине
        більше двох тижнів, половина забуде, що підписувалась, — і позначить
        лист як спам.
      </div>

      <button type="button" onClick={() => void load()} style={{ ...S.btn, marginTop: 20 }}>
        Оновити
      </button>
    </div>
  )
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div style={S.card}>
      <div style={S.cardLabel}>{label}</div>
      <div style={S.cardValue}>{value}</div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  wrap:      { maxWidth: 1000, margin: '0 auto', padding: '28px 18px 80px', fontFamily: FONT, color: '#e2e8f0' },
  h1:        { fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#fff' },
  h2:        { fontSize: 17, fontWeight: 700, margin: '30px 0 12px', color: GOLD },
  muted:     { fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 18px' },
  err:       { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 14px', color: '#fca5a5', fontSize: 14, marginBottom: 16 },
  cards:     { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  card:      { flex: '1 1 150px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 14, padding: '16px 18px' },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 6 },
  cardValue: { fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1 },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:        { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' },
  td:        { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tdNum:     { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  input:     { fontFamily: FONT, fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(245,166,35,0.3)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', outline: 'none' },
  btn:       { fontFamily: FONT, fontSize: 14, fontWeight: 800, padding: '10px 22px', borderRadius: 10, border: 'none', background: GOLD, color: '#1a1205', cursor: 'pointer' },
  note:      { marginTop: 24, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#b5c7dd', lineHeight: 1.7 },
}
