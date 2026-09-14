'use client'

import { useEffect, useState } from 'react'

/**
 * «Редакційні правки» в кабінеті автора — виконання п. 3.2-2 договору.
 *
 * Показуємо ТЕКСТ ПІСЛЯ ПРАВКИ, а не різницю. Різниця виглядає як таблиця
 * змін і читається погано; авторові треба побачити свій твір таким, яким
 * він вийде. Скільки слів було й стало — окремим рядком, це дає уявлення
 * про обсяг втручання без порівняння абзаців.
 *
 * Блок не показується взагалі, коли правок немає, — а це поки що звичайний
 * стан. Порожній розділ у кабінеті лише додає шуму.
 */

type Row = {
  id: string
  createdAt: string
  daysLeft: number
  note: string
  text: string
  wordsBefore: number
  wordsAfter: number
  episodeOrd: number
  entryTitle: string
  reply: string | null
  repliedAt: string | null
}

const GOLD = '#ef9f27'
const GOLD_L = '#FAC775'
const CREAM = '#e8eef7'
const MUTED = '#9fb0c6'
const CARD = '#0f1f38'
const LINE = 'rgba(255,255,255,.12)'

function d(iso: string): string {
  const t = new Date(iso)
  return `${String(t.getDate()).padStart(2, '0')}.${String(t.getMonth() + 1).padStart(2, '0')}.${t.getFullYear()}`
}

export default function AuthorRevisions() {
  const [rows, setRows] = useState<Row[]>([])
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<Record<string, string>>({})

  useEffect(() => {
    let alive = true
    fetch('/api/author/revisions', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { rows: [] }))
      .then(dta => { if (alive && Array.isArray(dta?.rows)) setRows(dta.rows as Row[]) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  async function send(id: string, agree: boolean) {
    setBusy(id)
    try {
      const res = await fetch('/api/author/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, agree, reply: agree ? '' : (draft[id] ?? '') }),
      })
      const dta = await res.json()
      if (!res.ok || !dta?.ok) {
        setMsg(m => ({ ...m, [id]: dta?.error || 'Не вдалося надіслати' }))
        return
      }
      setRows(rs => rs.map(r => r.id === id
        ? { ...r, reply: agree ? 'Автор погодився з редакційними правками.' : (draft[id] ?? ''), repliedAt: new Date().toISOString() }
        : r))
      setMsg(m => ({ ...m, [id]: 'Надіслано редакції.' }))
    } catch {
      setMsg(m => ({ ...m, [id]: 'Мережа не відповіла' }))
    } finally {
      setBusy('')
    }
  }

  if (rows.length === 0) return null

  return (
    <div style={{
      marginBottom: '1.5rem', padding: '1.1rem 1.25rem', borderRadius: 12,
      background: 'rgba(239,159,39,0.10)', border: '1px solid rgba(239,159,39,0.45)',
    }}>
      <div style={{ color: GOLD_L, fontWeight: 700, marginBottom: 6 }}>
        Редакційні правки ваших конкурсних серій
      </div>
      <div style={{ color: CREAM, lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 14 }}>
        Редактор опрацював текст. За договором, п. 3.2-2, ви маєте 14 днів, щоб
        заперечити або надіслати власну редакцію. Якщо не заперечите, твір
        виходить у редакції видавця.
      </div>

      {rows.map(r => {
        const answered = !!r.repliedAt
        const late = !answered && r.daysLeft <= 0
        return (
          <div key={r.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '13px 15px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <strong style={{ color: GOLD_L, fontSize: 15 }}>
                {r.entryTitle} · серія {r.episodeOrd}
              </strong>
              <span style={{ fontSize: 13, color: answered ? MUTED : late ? '#ff9c8a' : GOLD }}>
                {answered
                  ? `Ви відповіли ${d(r.repliedAt as string)}`
                  : late
                    ? 'Строк заперечення минув'
                    : `Залишилося днів: ${r.daysLeft}`}
              </span>
            </div>

            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
              Правка від {d(r.createdAt)} · було {r.wordsBefore} слів, стало {r.wordsAfter}
              {r.note ? ` · ${r.note}` : ''}
            </div>

            <button
              type="button"
              onClick={() => setOpen(o => ({ ...o, [r.id]: !o[r.id] }))}
              style={{
                marginTop: 10, fontSize: 13.5, fontFamily: 'inherit', fontWeight: 700,
                color: GOLD_L, background: 'transparent', border: `1px solid ${LINE}`,
                borderRadius: 8, padding: '.45rem .9rem', cursor: 'pointer',
              }}
            >
              {open[r.id] ? 'Сховати текст' : 'Показати опрацьований текст'}
            </button>

            {open[r.id] && (
              <pre style={{
                whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', fontSize: 15,
                lineHeight: 1.8, color: CREAM, background: 'rgba(0,0,0,.18)',
                border: `1px solid ${LINE}`, borderRadius: 8, padding: '.9rem 1rem', margin: '10px 0 0',
              }}>{r.text}</pre>
            )}

            {!answered && (
              <div style={{ marginTop: 12 }}>
                <textarea
                  value={draft[r.id] ?? ''}
                  onChange={e => setDraft(dr => ({ ...dr, [r.id]: e.target.value }))}
                  placeholder="Якщо не згодні — напишіть, що саме, або вставте свою редакцію"
                  rows={4}
                  style={{
                    width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 14,
                    color: CREAM, background: 'rgba(0,0,0,.18)', border: `1px solid ${LINE}`,
                    borderRadius: 8, padding: '.6rem .75rem', resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => send(r.id, true)}
                    style={{
                      fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', color: '#0a1628',
                      background: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8,
                      padding: '.5rem 1rem', cursor: 'pointer',
                    }}
                  >
                    Погоджуюся з правками
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id || !(draft[r.id] ?? '').trim()}
                    onClick={() => send(r.id, false)}
                    style={{
                      fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
                      color: (draft[r.id] ?? '').trim() ? GOLD_L : MUTED,
                      background: 'transparent', border: `1px solid ${LINE}`, borderRadius: 8,
                      padding: '.5rem 1rem', cursor: 'pointer',
                    }}
                  >
                    Надіслати заперечення
                  </button>
                </div>
              </div>
            )}

            {answered && r.reply && (
              <div style={{ fontSize: 13.5, color: MUTED, marginTop: 10, lineHeight: 1.65 }}>
                Ваша відповідь: {r.reply}
              </div>
            )}

            {msg[r.id] && (
              <div style={{ fontSize: 13, color: CREAM, marginTop: 8 }}>{msg[r.id]}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
