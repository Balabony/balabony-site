'use client'

import { useState } from 'react'

/**
 * Блок «Перевірка накрутки» в адмінці конкурсів.
 * Запускати перед підбиттям підсумків кожного конкурсу (рішення 15.11.2026).
 * Нічого не блокує — лише показує, рішення ухвалює редакція.
 */

const CARD = '#0f1f38'
const GOLD_L = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const LINE = 'rgba(255,255,255,.1)'

type Row = {
  entryId: string
  contest: string
  title: string
  author: string
  counted: number
  single: number
  retro: { email: string; registered: string; firstRead: string; firstOther: string }[]
}

export default function FarmingCheck() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/admin/nakrutka')
      const d = await res.json()
      if (!res.ok || !d.ok) throw new Error(d.error || 'Помилка')
      setRows(d.rows as Row[])
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10,
                  padding: '.9rem 1rem', marginBottom: '1.4rem' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: GOLD_L, flex: '1 1 260px' }}>
          Перевірка накрутки · запускати перед підсумками кожного конкурсу
        </div>
        <button onClick={run} disabled={busy} style={{
          background: GOLD_L, color: '#0a1628', border: 'none', borderRadius: 8,
          padding: '.45rem .9rem', font: 'inherit', fontSize: 13, fontWeight: 600,
          cursor: busy ? 'wait' : 'pointer',
        }}>
          {busy ? 'Перевіряю…' : rows ? 'Перевірити ще раз' : 'Перевірити'}
        </button>
      </div>

      <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, margin: '8px 0 0' }}>
        <b style={{ color: CREAM }}>Лише цей автор</b> — читачі, що дочитали роботу, але жодного
        іншого автора; зараз не зараховані. Багато таких — ознака ботів.{' '}
        <b style={{ color: CREAM }}>Зараховані заднім числом</b> — читачі, які іншого автора
        прочитали вже після цієї роботи. Серед них бувають чесні новачки, тож дивіться на дати
        реєстрації і схожі адреси.
      </p>

      {err && <p style={{ color: '#ff9b9b', fontSize: 12.5 }}>{err}</p>}

      {rows && rows.length === 0 && (
        <p style={{ fontSize: 12.5, color: CREAM, margin: '10px 0 0' }}>Підозрілого не знайдено.</p>
      )}

      {rows && rows.map(r => (
        <div key={r.entryId} style={{ borderTop: `1px solid ${LINE}`, padding: '.55rem 0', marginTop: 8 }}>
          <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.7 }}>
            <span style={{ color: CREAM }}>{r.title}</span> · {r.author}
            {' — '}зараховано: <b style={{ color: CREAM }}>{r.counted}</b>
            {' · '}лише цей автор: <b style={{ color: r.single >= 5 ? '#eab308' : CREAM }}>{r.single}</b>
            {' · '}заднім числом: <b style={{ color: r.retro.length ? '#eab308' : CREAM }}>{r.retro.length}</b>
            {r.retro.length > 0 && (
              <>
                {' '}
                <button onClick={() => setOpen(open === r.entryId ? null : r.entryId)} style={{
                  background: 'none', border: 'none', padding: 0, font: 'inherit',
                  color: GOLD_L, textDecoration: 'underline', cursor: 'pointer',
                }}>
                  {open === r.entryId ? 'сховати' : 'хто саме'}
                </button>
              </>
            )}
          </div>
          {open === r.entryId && (
            <ul style={{ margin: '.4rem 0 0', paddingLeft: 18, fontSize: 12, lineHeight: 1.8, color: MUTED }}>
              {r.retro.map(x => (
                <li key={x.email}>
                  <span style={{ color: CREAM }}>{x.email}</span>
                  {' · '}зареєстр. {x.registered} · дочитав роботу {x.firstRead} · іншого автора {x.firstOther}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
