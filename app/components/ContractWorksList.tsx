'use client'

import { useMemo, useState } from 'react'

const BRAND = {
  cream: '#0f1e3a',
  amber: '#ef9f27',
  amberDark: '#FFB347',
  ink: '#f5f0e8',
  text: '#dbe4f0',
  muted: '#8fa3c4',
  line: 'rgba(143,163,196,0.22)',
}

export type WorkRow = {
  id: string
  title: string
  prior_publication: string | null
  confirmed_at: string | null
}

type Props = {
  contractId: string
  contractNumber: string
  works: WorkRow[]
}

export default function ContractWorksList({ contractId, contractNumber, works }: Props) {
  const [rows, setRows] = useState<WorkRow[]>(works)
  const [prior, setPrior] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const pending = useMemo(() => rows.filter(w => !w.confirmed_at), [rows])
  const confirmed = useMemo(() => rows.filter(w => w.confirmed_at), [rows])

  async function send(items: { id: string; priorPublication: string | null }[]) {
    if (items.length === 0) return
    setBusy(true)
    setNote(null)
    try {
      const res = await fetch('/api/contracts/works/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, works: items }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!data.ok) {
        setNote(data.error || 'Не вдалося зберегти. Спробуйте ще раз.')
        return
      }
      const now = new Date().toISOString()
      const map = new Map(items.map(i => [i.id, i.priorPublication]))
      setRows(prev => prev.map(w => map.has(w.id)
        ? { ...w, confirmed_at: now, prior_publication: map.get(w.id) ?? null }
        : w))
      setNote(items.length === 1 ? 'Твір підтверджено.' : `Підтверджено творів: ${items.length}.`)
    } catch {
      setNote('Немає звʼязку із сервером.')
    } finally {
      setBusy(false)
    }
  }

  function confirmOne(w: WorkRow) {
    const p = (prior[w.id] ?? '').trim()
    void send([{ id: w.id, priorPublication: p ? p : null }])
  }

  function confirmAllClean() {
    const items = pending
      .filter(w => !(prior[w.id] ?? '').trim())
      .map(w => ({ id: w.id, priorPublication: null }))
    void send(items)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.95rem', color: '#f5f0e8', lineHeight: 1.7 }}>
          Це перелік творів до договору № {contractNumber} — Додаток № 1. Підтвердження твору
          означає, що ви погоджуєтесь на його розміщення та озвучення на умовах договору.
        </div>
        <div style={{ fontSize: '0.88rem', color: BRAND.muted, lineHeight: 1.7, marginTop: 8 }}>
          Якщо твір раніше публікувався в інших виданнях — впишіть яких. На такі твори
          передаються невиключні права: ви зможете й далі використовувати їх деінде.
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
        padding: '0.85rem 1rem', background: '#fffdf8', border: `1px solid ${BRAND.line}`,
        borderRadius: 10, marginBottom: '1.25rem',
      }}>
        <div style={{ fontSize: '0.9rem', color: BRAND.text }}>
          Підтверджено <strong>{confirmed.length}</strong> із {rows.length}
        </div>
        {pending.length > 0 && (
          <button type="button" onClick={confirmAllClean} disabled={busy} style={primaryBtn}>
            Підтвердити всі, що не публікувалися
          </button>
        )}
      </div>

      {rows.length === 0 && (
        <p style={{ color: BRAND.text }}>У переліку поки немає творів.</p>
      )}

      {rows.map(w => (
        <div key={w.id} style={{ borderTop: `1px solid ${BRAND.line}`, padding: '0.9rem 0' }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: '1 1 240px' }}>
              <div style={{ fontWeight: 700, color: BRAND.ink }}>{w.title}</div>
              {w.confirmed_at && (
                <div style={{ fontSize: '0.82rem', color: BRAND.muted, marginTop: 3 }}>
                  Підтверджено {new Date(w.confirmed_at).toLocaleDateString('uk-UA')}
                  {w.prior_publication ? ` · раніше: ${w.prior_publication}` : ''}
                </div>
              )}
            </div>
            <span style={{
              flex: 'none', fontSize: '0.72rem', padding: '3px 9px', borderRadius: 999,
              letterSpacing: '0.02em', whiteSpace: 'nowrap', lineHeight: 1.5,
              fontWeight: 700,
              ...(w.confirmed_at ? { background: 'rgba(151,196,89,0.16)', color: '#C0DD97', border: '1px solid rgba(151,196,89,0.4)' } : { background: 'rgba(143,163,196,0.15)', color: '#dbe4f0', border: '1px solid rgba(143,163,196,0.35)' }),
            }}>
              {w.confirmed_at ? 'Підтверджено' : 'Очікує'}
            </span>
          </div>

          {!w.confirmed_at && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={prior[w.id] ?? ''}
                onChange={e => setPrior(p => ({ ...p, [w.id]: e.target.value }))}
                placeholder="Раніше публікувався в… (якщо ні — лишіть порожнім)"
                style={{
                  flex: '1 1 260px', minWidth: 200, padding: '0.5rem 0.7rem',
                  border: `1px solid ${BRAND.line}`, borderRadius: 8, background: 'transparent',
                  color: BRAND.text, fontSize: '0.88rem', fontFamily: 'inherit',
                }}
              />
              <button type="button" onClick={() => confirmOne(w)} disabled={busy} style={secondaryBtn}>
                Підтвердити
              </button>
            </div>
          )}
        </div>
      ))}

      {note && (
        <p style={{ color: BRAND.text, fontSize: '0.9rem', marginTop: 16 }}>{note}</p>
      )}

      <p style={{ color: BRAND.muted, fontSize: '0.82rem', marginTop: 20, lineHeight: 1.6 }}>
        Перелік оновлюється автоматично. Ви можете будь-коли повернутися сюди й переглянути,
        які твори охоплені договором і коли ви їх підтвердили.
      </p>
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '0.5rem 0.9rem', borderRadius: 9, border: 'none',
  background: BRAND.amber, color: BRAND.ink, fontWeight: 700,
  fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
}

const secondaryBtn: React.CSSProperties = {
  padding: '0.5rem 0.9rem', borderRadius: 9, border: `1px solid ${BRAND.line}`,
  background: 'transparent', color: BRAND.text, fontSize: '0.85rem',
  cursor: 'pointer', fontFamily: 'inherit',
}
