'use client'

// Реєстр листування з авторами. Наскрізні номери присвоює база.
// Строки відповіді: 14 днів за п. 3.1-2, 30 днів за п. 2.4-1.

import { useEffect, useMemo, useState } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const RED = '#e56b6b'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'

type Row = {
  id: string
  number: string
  direction: 'in' | 'out'
  kind: string
  subject: string | null
  body: string | null
  author_id: string
  author_email: string | null
  author_name: string | null
  pen_name: string | null
  content_title: string | null
  happened_at: string
  due_at: string | null
  answered_at: string | null
  answered_number: string | null
  source: string
  note: string | null
  days_left: number | null
}

type Author = { id: string; name: string; email: string | null }

const KIND_LABEL: Record<string, string> = {
  edits_objection: 'Заперечення проти правок',
  archive_objection: 'Заперечення щодо архівного твору',
  withdrawal: 'Відкликання',
  contract: 'Договір',
  general: 'Інше',
}

const dt = (s: string | null) => (s ? new Date(s).toLocaleDateString('uk-UA') : '—')

export default function CorrespondencePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [open, setOpen] = useState(0)
  const [overdue, setOverdue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState<'all' | 'in' | 'out' | 'openonly' | 'overdue'>('all')
  const [showForm, setShowForm] = useState(false)

  const [fDirection, setFDirection] = useState<'in' | 'out'>('in')
  const [fAuthor, setFAuthor] = useState('')
  const [fKind, setFKind] = useState('general')
  const [fSubject, setFSubject] = useState('')
  const [fBody, setFBody] = useState('')
  const [fDate, setFDate] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/correspondence', { cache: 'no-store' })
      const d = (await res.json()) as {
        ok: boolean
        error?: string
        rows?: Row[]
        authors?: Author[]
        open?: number
        overdue?: number
      }
      if (!d.ok) {
        setErr(d.error ?? 'Не вдалося завантажити реєстр')
        return
      }
      setErr('')
      setRows(d.rows ?? [])
      setAuthors(d.authors ?? [])
      setOpen(d.open ?? 0)
      setOverdue(d.overdue ?? 0)
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const shown = useMemo(() => {
    if (filter === 'in') return rows.filter((r) => r.direction === 'in')
    if (filter === 'out') return rows.filter((r) => r.direction === 'out')
    if (filter === 'openonly') return rows.filter((r) => r.answered_at === null)
    if (filter === 'overdue')
      return rows.filter((r) => r.answered_at === null && r.days_left !== null && r.days_left < 0)
    return rows
  }, [rows, filter])

  const mark = async (r: Row, undo: boolean) => {
    setBusy(r.id)
    setNote('')
    try {
      const res = await fetch('/api/admin/correspondence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, undo }),
      })
      const d = (await res.json()) as { ok: boolean; error?: string }
      if (!d.ok) {
        setErr(d.error ?? 'Не вдалося оновити')
        return
      }
      setErr('')
      await load()
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setBusy(null)
    }
  }

  const create = async () => {
    if (!fAuthor) {
      setErr('Оберіть автора')
      return
    }
    setBusy('new')
    setNote('')
    try {
      const res = await fetch('/api/admin/correspondence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: fDirection,
          author_id: fAuthor,
          kind: fKind,
          subject: fSubject,
          body: fBody,
          happened_at: fDate || undefined,
        }),
      })
      const d = (await res.json()) as { ok: boolean; error?: string; number?: string }
      if (!d.ok) {
        setErr(d.error ?? 'Не вдалося записати')
        return
      }
      setErr('')
      setNote(`Записано під номером ${d.number ?? ''}`)
      setFSubject('')
      setFBody('')
      setFDate('')
      setShowForm(false)
      await load()
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setBusy(null)
    }
  }

  const th: React.CSSProperties = {
    textAlign: 'left', padding: '10px 12px', fontSize: 12, textTransform: 'uppercase',
    letterSpacing: 0.5, color: MUTED, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap',
  }
  const td: React.CSSProperties = {
    padding: '12px', borderBottom: `1px solid ${LINE}`, color: CREAM, fontSize: 14, verticalAlign: 'top',
  }
  const inp: React.CSSProperties = {
    width: '100%', background: NAVY_DEEP, color: CREAM, border: `1px solid ${LINE}`,
    borderRadius: 9, padding: '10px 12px', fontSize: 14, fontFamily: FONT,
  }
  const lbl: React.CSSProperties = {
    display: 'block', color: MUTED, fontSize: 12, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 6,
  }

  const tab = (v: typeof filter): React.CSSProperties => ({
    background: filter === v ? GOLD : 'transparent',
    color: filter === v ? '#1c1917' : MUTED,
    border: filter === v ? 'none' : `1px solid ${LINE}`,
    borderRadius: 9, padding: '8px 14px', fontWeight: 700, fontSize: 13,
    cursor: 'pointer', fontFamily: FONT,
  })

  return (
    <main style={{ minHeight: '100%', background: NAVY_DEEP, fontFamily: FONT, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ color: GOLD, fontSize: 26, margin: 0 }}>Реєстр листування</h1>
          <a href="/admin" style={{ color: MUTED, fontSize: 13, textDecoration: 'none' }}>← В адмінку</a>
        </div>

        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, marginBottom: 18, maxWidth: 760 }}>
          Наскрізна нумерація спільна для вхідних і вихідних листів. Строк відповіді рахується
          автоматично: 14 днів для заперечень проти правок (п. 3.1-2), 30 днів для архівних
          творів (п. 2.4-1). Звірка приходить на пошту 1 і 15 числа.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
          <button style={tab('all')} onClick={() => setFilter('all')}>Усі · {rows.length}</button>
          <button style={tab('in')} onClick={() => setFilter('in')}>Вхідні</button>
          <button style={tab('out')} onClick={() => setFilter('out')}>Вихідні</button>
          <button style={tab('openonly')} onClick={() => setFilter('openonly')}>Без відповіді · {open}</button>
          <button
            style={{ ...tab('overdue'), color: filter === 'overdue' ? '#1c1917' : overdue > 0 ? RED : MUTED }}
            onClick={() => setFilter('overdue')}
          >
            Прострочені · {overdue}
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{ background: GOLD, color: '#1c1917', border: 'none', borderRadius: 9, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}
          >
            {showForm ? 'Згорнути' : 'Завести лист'}
          </button>
        </div>

        {err && (
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(245,240,232,0.45)', color: CREAM, fontWeight: 600, padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
            {err}
          </div>
        )}
        {note && (
          <div style={{ background: 'rgba(239,159,39,0.13)', border: `1px solid ${GOLD}55`, color: CREAM, padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
            {note}
          </div>
        )}

        {showForm && (
          <div style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Напрям</label>
                <select style={inp} value={fDirection} onChange={(e) => setFDirection(e.target.value === 'out' ? 'out' : 'in')}>
                  <option value="in">Вхідний — від автора</option>
                  <option value="out">Вихідний — авторові</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Автор</label>
                <select style={inp} value={fAuthor} onChange={(e) => setFAuthor(e.target.value)}>
                  <option value="">— оберіть —</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Тип звернення</label>
                <select style={inp} value={fKind} onChange={(e) => setFKind(e.target.value)}>
                  {Object.entries(KIND_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Дата (порожньо — сьогодні)</label>
                <input style={inp} type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Тема</label>
              <input style={inp} value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="Коротко про що лист" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Текст</label>
              <textarea style={{ ...inp, minHeight: 110, resize: 'vertical' }} value={fBody} onChange={(e) => setFBody(e.target.value)} />
            </div>
            <button
              onClick={() => void create()}
              disabled={busy !== null}
              style={{ background: GOLD, color: '#1c1917', border: 'none', borderRadius: 9, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: busy ? 'default' : 'pointer', opacity: busy === 'new' ? 0.6 : 1, fontFamily: FONT }}
            >
              {busy === 'new' ? 'Записую…' : 'Записати в реєстр'}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ color: MUTED }}>Завантаження…</div>
        ) : shown.length === 0 ? (
          <div style={{ color: MUTED }}>Записів немає.</div>
        ) : (
          <div style={{ background: NAVY, borderRadius: 14, overflowX: 'auto', border: `1px solid ${LINE}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 48, textAlign: 'right' }}>№</th>
                  <th style={th}>Номер</th>
                  <th style={th}>Напрям</th>
                  <th style={th}>Автор</th>
                  <th style={th}>Тип</th>
                  <th style={th}>Дата</th>
                  <th style={th}>Строк</th>
                  <th style={th}>Відповідь</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => {
                  const late = r.answered_at === null && r.days_left !== null && r.days_left < 0
                  return (
                    <tr key={r.id}>
                      <td style={{ ...td, color: MUTED, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 700, whiteSpace: 'nowrap' }}>{r.number}</td>
                      <td style={{ ...td, color: r.direction === 'in' ? GOLD : MUTED, whiteSpace: 'nowrap' }}>
                        {r.direction === 'in' ? 'вхідний' : 'вихідний'}
                      </td>
                      <td style={td}>
                        {r.author_name ?? <span style={{ color: MUTED }}>без профілю</span>}
                        {r.subject && <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{r.subject}</div>}
                        {r.content_title && <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{r.content_title}</div>}
                      </td>
                      <td style={{ ...td, fontSize: 13 }}>{KIND_LABEL[r.kind] ?? r.kind}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{dt(r.happened_at)}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap', color: late ? RED : CREAM, fontWeight: late ? 700 : 400 }}>
                        {r.due_at === null ? '—' : (
                          <>
                            {dt(r.due_at)}
                            {r.answered_at === null && r.days_left !== null && (
                              <div style={{ fontSize: 12, marginTop: 4, color: late ? RED : MUTED }}>
                                {late ? `прострочено на ${Math.abs(r.days_left)} дн.` : `лишилось ${r.days_left} дн.`}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {r.answered_at ? dt(r.answered_at) : <span style={{ color: MUTED }}>немає</span>}
                        {r.answered_number && <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{r.answered_number}</div>}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <button
                          onClick={() => void mark(r, r.answered_at !== null)}
                          disabled={busy !== null}
                          style={{
                            background: r.answered_at ? 'transparent' : GOLD,
                            color: r.answered_at ? MUTED : '#1c1917',
                            border: r.answered_at ? `1px solid ${LINE}` : 'none',
                            borderRadius: 9, padding: '8px 14px', fontWeight: 700, fontSize: 13,
                            cursor: busy ? 'default' : 'pointer', opacity: busy === r.id ? 0.6 : 1,
                            whiteSpace: 'nowrap', fontFamily: FONT,
                          }}
                        >
                          {busy === r.id ? '…' : r.answered_at ? 'Скасувати' : 'Відповіли'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
