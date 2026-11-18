'use client'

import { useState } from 'react'

type Decision = 'publish' | 'return'
const OPTIONS: [Decision, string, string][] = [
  ['publish', 'Опублікувати', '#22c55e'],
  ['return', 'Повернути автору', '#f87171'],
]

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628'
const CARD = '#0f1f38'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const LINE = 'rgba(255,255,255,.15)'

export default function DecisionForm({ contentId, closed }: { contentId: string; closed: boolean }) {
  const [v, setV] = useState<Decision | null>(null)
  const [c, setC] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)

  const save = async () => {
    if (!v) { setMsg('Оберіть рішення'); return }
    if (v === 'return' && c.trim().length < 30) { setMsg('Поясніть автору, що поправити (від 30 символів)'); return }
    if (!window.confirm(v === 'publish' ? 'Рішення остаточне: твір одразу з’явиться на сайті, автор отримає лист. Опублікувати?' : 'Рішення остаточне: твір повернеться автору в чернетки, автор одразу отримає лист з вашим коментарем. Надіслати?')) return
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/editor/content-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, decision: v, comment: c }),
      })
      const d = await r.json() as { ok?: boolean; error?: string }
      if (d.ok) { setDone(true); setMsg(v === 'publish' ? 'Дякуємо! Твір опубліковано, автор отримав лист.' : 'Дякуємо! Твір повернуто автору, він отримав лист.') }
      else setMsg(d.error ?? 'Не вдалося зберегти')
    } catch {
      setMsg('Немає звʼязку з сервером')
    } finally { setBusy(false) }
  }

  if (closed || done) return <p style={{ color: MUTED, fontFamily: FONT }}>{done ? msg : 'Рішення щодо цього твору вже ухвалено. Дякуємо!'}</p>

  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '1rem 1.1rem', fontFamily: FONT }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: CREAM, marginBottom: 10 }}>Ваше рішення</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {OPTIONS.map(([key, label, color]) => (
          <button key={key} type="button" onClick={() => setV(key)} aria-pressed={v === key}
            style={{
              padding: '9px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 700,
              border: `2px solid ${color}`, background: v === key ? color : 'transparent', color: v === key ? NAVY : color,
            }}>
            {label}
          </button>
        ))}
      </div>
      <label style={{ display: 'block', fontSize: 13.5, color: MUTED, marginBottom: 6 }} htmlFor="decision-comment">
        Коментар для автора (за бажанням, якщо публікуєте; обовʼязково, якщо повертаєте: що саме поправити). Автор отримає його в листі без вашого імені.
      </label>
      <textarea id="decision-comment" value={c} onChange={e => setC(e.target.value)} maxLength={3000}
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 120, padding: 10, borderRadius: 9, border: `1px solid ${LINE}`, background: NAVY, color: CREAM, fontFamily: FONT, fontSize: 14.5, lineHeight: 1.6 }} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
        <button type="button" disabled={busy} onClick={save}
          style={{ padding: '10px 18px', borderRadius: 9, border: 'none', background: '#ef9f27', color: NAVY, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: FONT, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Надсилаємо…' : 'Ухвалити рішення'}
        </button>
        {msg && <span role="status" style={{ fontSize: 14, color: MUTED }}>{msg}</span>}
      </div>
    </div>
  )
}
