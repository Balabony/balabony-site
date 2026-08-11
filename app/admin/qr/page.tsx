'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'

/**
 * /admin/qr — керування короткими посиланнями для газети й пошти.
 *
 * Головна операція: щопонеділка перевести газетний код на нову серію.
 * Код у газеті надрукований і не міняється — міняється тільки ціль тут.
 *
 * Сторінка навмисно попереджає про день тижня: міняти ціль можна лише коли
 * попередній номер уже відпрацював, інакше читачі з газети, яка в них на
 * руках, потраплять не на ту серію.
 */

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"

interface Link    { code: string; target: string; campaign: string | null; is_active: boolean | null; channel: string | null }
interface Hit     { code: string; created_at: string }
interface Episode { slug: string; title: string; season_number: number | null; episode_number: number | null; is_free: boolean | null; status: string | null }

interface Data {
  links: Link[]; hits: Hit[]; episodes: Episode[]
  errors?: Record<string, string | null>
}

export default function QrPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [newTarget, setNewTarget] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/qr-links')
      if (res.status === 401) { setErr('Потрібен вхід в адмінку'); setLoading(false); return }
      setData(await res.json() as Data)
      setErr('')
    } catch {
      setErr('Не вдалося завантажити')
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const save = async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/qr-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (json.ok) {
        setMsg('Збережено')
        setErr('')
        setEditing(null)
        await load()
        setTimeout(() => setMsg(''), 3000)
      } else {
        setErr(json.error ?? 'Не збереглося')
      }
    } catch {
      setErr('Помилка збереження')
    }
  }

  /** Сьогодні понеділок? У понеділок газета вже в людей — міняти ціль небезпечно. */
  const dayWarning = useMemo(() => {
    const d = new Date().getDay() // 0 нд, 1 пн
    if (d === 1) return 'Сьогодні понеділок — номер уже в людей на руках. Міняти ціль зараз означає відправити читачів газети не на ту серію.'
    if (d >= 2 && d <= 5) return 'Тиждень у розпалі: газета з попереднього номера ще працює. Ціль краще міняти в неділю ввечері.'
    return null
  }, [])

  const hitsByCode = useMemo(() => {
    const m = new Map<string, number>()
    ;(data?.hits ?? []).forEach(h => m.set(h.code, (m.get(h.code) ?? 0) + 1))
    return m
  }, [data])

  /** Останні сім днів по коду — щоб бачити, чи код узагалі живий. */
  const weekByCode = useMemo(() => {
    const since = Date.now() - 7 * 24 * 3600 * 1000
    const m = new Map<string, number>()
    ;(data?.hits ?? []).forEach(h => {
      if (new Date(h.created_at).getTime() >= since) {
        m.set(h.code, (m.get(h.code) ?? 0) + 1)
      }
    })
    return m
  }, [data])

  const freeEpisodes = useMemo(
    () => (data?.episodes ?? []).filter(e => !e.slug.startsWith('tysha-')),
    [data],
  )

  if (loading) return <div style={S.wrap}><p style={S.muted}>Завантаження…</p></div>

  return (
    <div style={S.wrap}>
      <h1 style={S.h1}>Короткі посилання</h1>
      <p style={S.muted}>
        Код у газеті надрукований назавжди — міняється лише те, куди він веде.
        Це дозволяє вести кожен номер на нову серію без нового QR.
      </p>

      {dayWarning && <div style={S.warn}>{dayWarning}</div>}
      {err && <div style={S.err}>{err}</div>}
      {msg && <div style={S.ok}>{msg}</div>}

      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Код</th>
            <th style={S.th}>Адреса</th>
            <th style={S.th}>Веде на</th>
            <th style={S.th}>Канал</th>
            <th style={S.th}>За тиждень</th>
            <th style={S.th}>Усього</th>
            <th style={S.th}>Стан</th>
            <th style={S.th}></th>
          </tr>
        </thead>
        <tbody>
          {(data?.links ?? []).length === 0 && (
            <tr><td colSpan={8} style={S.td}>Посилань ще немає</td></tr>
          )}
          {(data?.links ?? []).map(l => {
            const prefix = (l.channel ?? 'gazeta') === 'gazeta' ? 'g' : 'm'
            const isEditing = editing === l.code
            return (
              <tr key={l.code}>
                <td style={S.td}><code>{l.code}</code></td>
                <td style={S.td}>
                  <code style={{ fontSize: 12 }}>balabony.com/{prefix}/{l.code}</code>
                </td>
                <td style={S.td}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <select
                        value={newTarget}
                        onChange={e => setNewTarget(e.target.value)}
                        style={{ ...S.input, flex: '1 1 220px' }}
                      >
                        <option value="">— оберіть серію —</option>
                        {freeEpisodes.map(e => (
                          <option key={e.slug} value={`/episodes/${e.slug}`}>
                            {e.episode_number}. {e.title}{e.is_free ? ' (безкоштовна)' : ' — ПЛАТНА'}
                          </option>
                        ))}
                        <option value="/stories">Усі історії</option>
                        <option value="/episodes">Усі серії</option>
                        <option value="/konkursy">Конкурси</option>
                        <option value="/">Головна</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => newTarget && save({ code: l.code, target: newTarget })}
                        style={S.btnSm}
                      >
                        Зберегти
                      </button>
                      <button type="button" onClick={() => setEditing(null)} style={S.btnGhost}>
                        Скасувати
                      </button>
                    </div>
                  ) : (
                    <span>{l.target}</span>
                  )}
                </td>
                <td style={S.td}>{(l.channel ?? 'gazeta') === 'gazeta' ? 'газета' : 'пошта'}</td>
                <td style={S.tdNum}>{weekByCode.get(l.code) ?? 0}</td>
                <td style={S.tdNum}>{hitsByCode.get(l.code) ?? 0}</td>
                <td style={S.td}>
                  {l.is_active === false
                    ? <span style={{ color: '#94a3b8' }}>вимкнено</span>
                    : <span style={{ color: '#22c55e' }}>працює</span>}
                </td>
                <td style={S.td}>
                  {!isEditing && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => { setEditing(l.code); setNewTarget(l.target) }}
                        style={S.btnSm}
                      >
                        Змінити ціль
                      </button>
                      <button
                        type="button"
                        onClick={() => save({ code: l.code, is_active: !(l.is_active !== false) })}
                        style={S.btnGhost}
                      >
                        {l.is_active === false ? 'Увімкнути' : 'Вимкнути'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={S.note}>
        <b>Як користуватись щотижня.</b> У неділю ввечері, коли попередній номер
        уже відпрацював: натиснути «Змінити ціль» на коді <code>1</code>, обрати
        серію наступного номера, зберегти. QR у газеті лишається той самий.
        Перед зміною перевірити, що обрана серія позначена як безкоштовна —
        інакше читач із газети впреться в замок.
      </div>

      <button type="button" onClick={() => void load()} style={{ ...S.btn, marginTop: 20 }}>
        Оновити
      </button>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  wrap:   { maxWidth: 1100, margin: '0 auto', padding: '28px 18px 80px', fontFamily: FONT, color: '#e2e8f0' },
  h1:     { fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#fff' },
  muted:  { fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 18px' },
  warn:   { background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.45)', borderRadius: 10, padding: '12px 14px', color: '#fcd9a0', fontSize: 14, marginBottom: 16, lineHeight: 1.6 },
  err:    { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 14px', color: '#fca5a5', fontSize: 14, marginBottom: 16 },
  ok:     { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 10, padding: '12px 14px', color: '#86efac', fontSize: 14, marginBottom: 16 },
  table:  { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:     { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' },
  td:     { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', verticalAlign: 'top' },
  tdNum:  { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  input:  { fontFamily: FONT, fontSize: 13, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(245,166,35,0.3)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', outline: 'none' },
  btn:    { fontFamily: FONT, fontSize: 14, fontWeight: 800, padding: '10px 22px', borderRadius: 10, border: 'none', background: GOLD, color: '#1a1205', cursor: 'pointer' },
  btnSm:  { fontFamily: FONT, fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 8, border: 'none', background: GOLD, color: '#1a1205', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnGhost: { fontFamily: FONT, fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#c8d4e8', cursor: 'pointer', whiteSpace: 'nowrap' },
  note:   { marginTop: 24, padding: '16px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13, color: '#b5c7dd', lineHeight: 1.7 },
}
