'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'

/**
 * /admin/rozklad — розклад виходу серій, вівторок і п'ятниця о 18:00.
 *
 * Ритм обіцяний читачам у блоці збору пошти під кожною історією, тому це
 * зобов'язання. Сторінка показує найближчі дати й що на них призначено —
 * порожній слот видно за тижні, а не в день публікації.
 *
 * Кнопка «Заповнити» ставить наступні вільні серії на найближчі вільні дати
 * підряд. Це економить головну щотижневу рутину.
 */

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"

interface Episode {
  id: string; slug: string; title: string
  season_number: number | null; episode_number: number | null
  publish_at: string | null; status: string | null
  is_free: boolean | null; is_premium: boolean | null
}
interface Data { episodes: Episode[]; error?: string | null }

/** Найближчі N слотів: вівторок і п'ятниця о 18:00 за Києвом. */
function nextSlots(n: number): Date[] {
  const out: Date[] = []
  const d = new Date()
  d.setHours(18, 0, 0, 0)
  // якщо сьогодні слот, але час минув — починаємо з завтра
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1)
  while (out.length < n) {
    const day = d.getDay() // 2 вт, 5 пт
    if (day === 2 || day === 5) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

function fmtSlot(d: Date): string {
  return d.toLocaleDateString('uk-UA', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function sameSlot(iso: string | null, slot: Date): boolean {
  if (!iso) return false
  const a = new Date(iso)
  return a.getFullYear() === slot.getFullYear()
    && a.getMonth() === slot.getMonth()
    && a.getDate() === slot.getDate()
}

export default function RozkladPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [serial, setSerial] = useState<'balabony' | 'tysha'>('balabony')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/rozklad-data')
      if (res.status === 401) { setErr('Потрібен вхід в адмінку'); setLoading(false); return }
      setData(await res.json() as Data)
      setErr('')
    } catch {
      setErr('Не вдалося завантажити')
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const setDate = async (slug: string, publish_at: string | null) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/rozklad-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, publish_at }),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (json.ok) { setMsg('Збережено'); setTimeout(() => setMsg(''), 2500); await load() }
      else setErr(json.error ?? 'Не збереглося')
    } catch {
      setErr('Помилка збереження')
    }
    setBusy(false)
  }

  const episodes = useMemo(() => {
    const all = data?.episodes ?? []
    return all
      .filter(e => serial === 'tysha' ? e.slug.startsWith('tysha-') : !e.slug.startsWith('tysha-'))
      .sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0))
  }, [data, serial])

  const slots = useMemo(() => nextSlots(12), [])

  /** Що призначено на кожен слот. */
  const scheduled = useMemo(() => {
    return slots.map(slot => ({
      slot,
      episode: episodes.find(e => sameSlot(e.publish_at, slot)) ?? null,
    }))
  }, [slots, episodes])

  /** Серії без дати — кандидати на заповнення. */
  const unscheduled = useMemo(
    () => episodes.filter(e => !e.publish_at),
    [episodes],
  )

  /** Ставить найближчі вільні серії на вільні слоти підряд. */
  const fillSlots = async () => {
    const free = scheduled.filter(s => !s.episode)
    const queue = [...unscheduled]
    if (free.length === 0 || queue.length === 0) {
      setErr('Немає вільних слотів або серій без дати')
      return
    }
    setBusy(true)
    for (const s of free) {
      const ep = queue.shift()
      if (!ep) break
      await fetch('/api/admin/rozklad-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: ep.slug, publish_at: s.slot.toISOString() }),
      })
    }
    setBusy(false)
    setMsg('Розклад заповнено')
    setTimeout(() => setMsg(''), 3000)
    await load()
  }

  if (loading) return <div style={S.wrap}><p style={S.muted}>Завантаження…</p></div>

  const emptyCount = scheduled.filter(s => !s.episode).length

  return (
    <div style={S.wrap}>
      <h1 style={S.h1}>Розклад публікацій</h1>
      <p style={S.muted}>
        Вівторок і п&apos;ятниця о 18:00. Цей ритм обіцяно читачам у блоці збору
        пошти під кожною історією — порожній слот означає невиконану обіцянку.
      </p>

      {err && <div style={S.err}>{err}</div>}
      {msg && <div style={S.ok}>{msg}</div>}

      {emptyCount > 0 && (
        <div style={S.warn}>
          Порожніх слотів попереду: <b>{emptyCount}</b> із {slots.length}.
          {unscheduled.length > 0 && ` Серій без дати: ${unscheduled.length}.`}
        </div>
      )}

      <div style={S.tabs}>
        <button type="button" onClick={() => setSerial('balabony')} style={serial === 'balabony' ? S.tabOn : S.tab}>Балабони</button>
        <button type="button" onClick={() => setSerial('tysha')} style={serial === 'tysha' ? S.tabOn : S.tab}>Тиша</button>
      </div>

      <h2 style={S.h2}>Найближчі виходи</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Дата</th>
            <th style={S.th}>Серія</th>
            <th style={S.th}>Доступ</th>
            <th style={S.th}></th>
          </tr>
        </thead>
        <tbody>
          {scheduled.map(({ slot, episode }) => (
            <tr key={slot.toISOString()}>
              <td style={S.td}>{fmtSlot(slot)} · 18:00</td>
              <td style={S.td}>
                {episode
                  ? <span>{episode.episode_number}. {episode.title}</span>
                  : <span style={{ color: '#fca5a5' }}>порожньо</span>}
              </td>
              <td style={S.td}>
                {episode
                  ? (episode.is_free ? 'безкоштовна' : 'платна')
                  : '—'}
              </td>
              <td style={S.td}>
                {episode ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setDate(episode.slug, null)}
                    style={S.btnGhost}
                  >
                    Зняти дату
                  </button>
                ) : (
                  <select
                    disabled={busy}
                    defaultValue=""
                    onChange={e => e.target.value && void setDate(e.target.value, slot.toISOString())}
                    style={S.input}
                  >
                    <option value="">— поставити серію —</option>
                    {unscheduled.map(ep => (
                      <option key={ep.slug} value={ep.slug}>
                        {ep.episode_number}. {ep.title}
                      </option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {emptyCount > 0 && unscheduled.length > 0 && (
        <button type="button" disabled={busy} onClick={() => void fillSlots()} style={{ ...S.btn, marginTop: 16 }}>
          {busy ? 'Заповнюю…' : `Заповнити ${Math.min(emptyCount, unscheduled.length)} слотів підряд`}
        </button>
      )}

      <h2 style={S.h2}>Серії без дати ({unscheduled.length})</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>№</th>
            <th style={S.th}>Назва</th>
            <th style={S.th}>Статус</th>
            <th style={S.th}>Доступ</th>
          </tr>
        </thead>
        <tbody>
          {unscheduled.length === 0 && (
            <tr><td colSpan={4} style={S.td}>Усі серії мають дату</td></tr>
          )}
          {unscheduled.slice(0, 40).map(e => (
            <tr key={e.slug}>
              <td style={S.td}>{e.episode_number}</td>
              <td style={S.td}>{e.title}</td>
              <td style={S.td}>{e.status}</td>
              <td style={S.td}>{e.is_free ? 'безкоштовна' : 'платна'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={S.note}>
        <b>Що робити щотижня.</b> Заглянути сюди в неділю: якщо попереду є
        порожні слоти — заповнити. Перші дві серії кожного сезону мають бути
        безкоштовними, інакше читач із газети впреться в замок одразу.
      </div>

      <button type="button" onClick={() => void load()} style={{ ...S.btn, marginTop: 20 }}>
        Оновити
      </button>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  wrap:   { maxWidth: 1000, margin: '0 auto', padding: '28px 18px 80px', fontFamily: FONT, color: '#e2e8f0' },
  h1:     { fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#fff' },
  h2:     { fontSize: 17, fontWeight: 700, margin: '30px 0 12px', color: GOLD },
  muted:  { fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 18px' },
  err:    { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 14px', color: '#fca5a5', fontSize: 14, marginBottom: 16 },
  ok:     { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 10, padding: '12px 14px', color: '#86efac', fontSize: 14, marginBottom: 16 },
  warn:   { background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.45)', borderRadius: 10, padding: '12px 14px', color: '#fcd9a0', fontSize: 14, marginBottom: 16, lineHeight: 1.6 },
  tabs:   { display: 'flex', gap: 8, marginBottom: 8 },
  tab:    { fontFamily: FONT, fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(245,166,35,0.3)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' },
  tabOn:  { fontFamily: FONT, fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: 'none', background: GOLD, color: '#1a1205', cursor: 'pointer' },
  table:  { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:     { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' },
  td:     { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  input:  { fontFamily: FONT, fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(245,166,35,0.3)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', outline: 'none', maxWidth: 260 },
  btn:    { fontFamily: FONT, fontSize: 14, fontWeight: 800, padding: '10px 22px', borderRadius: 10, border: 'none', background: GOLD, color: '#1a1205', cursor: 'pointer' },
  btnGhost: { fontFamily: FONT, fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#c8d4e8', cursor: 'pointer' },
  note:   { marginTop: 24, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#b5c7dd', lineHeight: 1.7 },
}
