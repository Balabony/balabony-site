'use client'

import { useState } from 'react'

type Verdict = 'accept' | 'revise' | 'reject'
const OPTIONS: [Verdict, string, string][] = [
  ['accept', 'Приймати', '#22c55e'],
  ['revise', 'Приймати після доопрацювання', '#eab308'],
  ['reject', 'Відхилити', '#f87171'],
]

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628'
const CARD = '#0f1f38'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const LINE = 'rgba(255,255,255,.15)'

export default function VerdictForm({ appId, verdict, comment, closed }: { appId: string; verdict: Verdict | null; comment: string; closed: boolean }) {
  const [v, setV] = useState<Verdict | null>(verdict)
  const [c, setC] = useState(comment)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    if (!v) { setMsg('Оберіть рішення'); return }
    if (c.trim().length < 30) { setMsg('Напишіть коментар — хоча б одне-два речення (від 30 символів)'); return }
    if (!window.confirm(v === 'reject' ? 'Рішення остаточне: автор одразу отримає лист про відмову з вашим коментарем. Надіслати?' : 'Рішення остаточне: автору одразу відкриється кабінет і піде лист з вашим коментарем. Надіслати?')) return
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/editor/application-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, verdict: v, comment: c }),
      })
      const d = await r.json() as { ok?: boolean; error?: string }
      setMsg(d.ok ? 'Дякуємо! Рішення ухвалено, автор отримав лист.' : (d.error ?? 'Не вдалося зберегти'))
    } catch {
      setMsg('Немає звʼязку з сервером')
    } finally { setBusy(false) }
  }

  if (closed) return <p style={{ color: MUTED, fontFamily: FONT }}>Рішення щодо цієї заявки вже ухвалено. Дякуємо!</p>

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
      <label style={{ display: 'block', fontSize: 13.5, color: MUTED, marginBottom: 6 }} htmlFor="verdict-comment">
        Коментар для автора: що вдалося, що поправити. Якщо потрібне доопрацювання — що саме. Автор отримає цей коментар у листі (без вашого імені), тож пишіть так, як написали б людині.
      </label>
      <textarea id="verdict-comment" value={c} onChange={e => setC(e.target.value)} maxLength={3000}
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
