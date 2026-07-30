'use client'

import { useEffect, useState } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'

type ContractRow = {
  id: string
  number: string
  status: string
  author_id: string
  author_name: string | null
  pen_name: string | null
  in_list: number
  author_works: number
  missing: number
  orphan_rows: number
}

export default function SyncWorksPage() {
  const [rows, setRows] = useState<ContractRow[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sync-contract-works', { cache: 'no-store' })
      const d = (await res.json()) as { ok: boolean; error?: string; contracts?: ContractRow[] }
      if (!d.ok) {
        setErr(d.error ?? 'Не вдалося завантажити договори')
        return
      }
      setErr('')
      setRows(d.contracts ?? [])
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const sync = async (r: ContractRow) => {
    const who = r.author_name ?? r.author_id.slice(0, 8)
    if (!confirm(`Додати ${r.missing} творів у перелік договору ${r.number} (${who})?`)) return

    setBusy(r.id)
    setNote('')
    try {
      const res = await fetch('/api/admin/sync-contract-works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: r.id }),
      })
      const d = (await res.json()) as {
        ok: boolean
        error?: string
        healed?: number
        added?: number
        total?: number
      }
      if (!d.ok) {
        setErr(d.error ?? 'Не вдалося синхронізувати')
        return
      }
      setErr('')
      setNote(
        `Договір ${r.number}: додано ${d.added ?? 0}, зшито зі старими рядками ${d.healed ?? 0}. ` +
        `У переліку тепер ${d.total ?? 0}.`,
      )
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

  return (
    <main style={{ minHeight: '100%', background: NAVY_DEEP, fontFamily: FONT, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ color: GOLD, fontSize: 26, margin: 0 }}>Перелік творів за договорами</h1>
          <a href="/admin" style={{ color: MUTED, fontSize: 13, textDecoration: 'none' }}>← В адмінку</a>
        </div>

        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, marginBottom: 20, maxWidth: 720 }}>
          Синхронізація додає в Додаток № 1 усі твори, прив&apos;язані до автора, яких у переліку ще немає.
          Рядки лягають непідтвердженими — акцепт автор дає сам у кабінеті. Чернетки не беруться: вийде з draft — запустите ще раз. Нічого не видаляється.
          Перед синхронізацією переконайтесь, що прив&apos;язка авторів на{' '}
          <a href="/admin/link-authors" style={{ color: GOLD }}>/admin/link-authors</a> зроблена правильно:
          у перелік потрапить усе, що зараз висить на цьому author_id.
        </p>

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

        {loading ? (
          <div style={{ color: MUTED }}>Завантаження…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: MUTED }}>Договорів немає.</div>
        ) : (
          <div style={{ background: NAVY, borderRadius: 14, overflowX: 'auto', border: `1px solid ${LINE}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={th}>Договір</th>
                  <th style={th}>Автор</th>
                  <th style={th}>У переліку</th>
                  <th style={th}>Готових творів</th>
                  <th style={th}>Бракує</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>
                      <div style={{ fontWeight: 700 }}>{r.number}</div>
                      <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{r.status}</div>
                    </td>
                    <td style={td}>
                      {r.author_name ?? <span style={{ color: MUTED }}>без профілю</span>}
                      {r.pen_name && <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>{r.pen_name}</div>}
                    </td>
                    <td style={td}>
                      {r.in_list}
                      {r.orphan_rows > 0 && (
                        <div style={{ color: GOLD, fontSize: 12, marginTop: 4 }}>
                          без звʼязку: {r.orphan_rows}
                        </div>
                      )}
                    </td>
                    <td style={td}>{r.author_works}</td>
                    <td style={{ ...td, color: r.missing > 0 ? GOLD : MUTED, fontWeight: 700 }}>{r.missing}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <button
                        onClick={() => void sync(r)}
                        disabled={busy !== null || r.missing === 0}
                        style={{
                          background: r.missing === 0 ? 'transparent' : GOLD,
                          color: r.missing === 0 ? MUTED : '#1c1917',
                          border: r.missing === 0 ? `1px solid ${LINE}` : 'none',
                          borderRadius: 9, padding: '9px 16px', fontWeight: 700, fontSize: 13,
                          cursor: busy !== null || r.missing === 0 ? 'default' : 'pointer',
                          opacity: busy === r.id ? 0.6 : 1, whiteSpace: 'nowrap',
                        }}
                      >
                        {busy === r.id ? 'Додаю…' : r.missing === 0 ? 'Все на місці' : 'Синхронізувати'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
