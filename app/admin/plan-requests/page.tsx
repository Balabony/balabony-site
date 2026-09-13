'use client'

/**
 * /admin/plan-requests — заявки юросіб на корпоративний і бібліотечний доступ.
 *
 * Порядок роботи, який ця сторінка обслуговує:
 *   1. Заявка надійшла  → стан «нова»
 *   2. Виставили рахунок → тиснемо «Рахунок виставлено»
 *   3. Кошти надійшли    → «Відкрити доступ»: вказуємо пошту контактної
 *      особи, сайт створює групу місць і робить її власником
 *   4. Далі власник сам запрошує людей на /group
 *
 * Рахунок і акт формуються поза сайтом, звичайним порядком ФОПа.
 */

import { useState, useEffect, useCallback } from 'react'

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0f1e3a'
const GOLD = '#ef9f27'
const CREAM = '#f5f0e8'
const MUTED = '#8899bb'

interface Row {
  id: string
  kind: 'corporate' | 'library'
  seats: number
  org_name: string
  edrpou: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  note: string | null
  status: 'new' | 'invoiced' | 'paid' | 'cancelled'
  plan_group_id: string | null
  admin_note: string | null
  created_at: string
}

const KIND_LABEL: Record<string, string> = {
  corporate: 'Корпоративний · 25 місць · 8 900 ₴',
  library: 'Бібліотечний · 50 місць · 8 900 ₴',
}

const STATUS_LABEL: Record<string, string> = {
  new: 'нова',
  invoiced: 'рахунок виставлено',
  paid: 'оплачено, доступ відкрито',
  cancelled: 'скасовано',
}

const STATUS_COLOR: Record<string, string> = {
  new: '#FAC775',
  invoiced: '#7dd3fc',
  paid: '#86efac',
  cancelled: '#9ca3af',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export default function PlanRequestsPage() {
  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/plan-requests')
      if (r.status === 401) { setMsg('Потрібен вхід в адмінку.'); return }
      const d = await r.json()
      setItems(d.items ?? [])
    } catch {
      setMsg('Не вдалося завантажити заявки.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const setStatus = async (id: string, status: string) => {
    setBusy(id); setMsg(null)
    try {
      const r = await fetch('/api/admin/plan-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const d = await r.json()
      if (d.ok) await load()
      else setMsg(d.message ?? 'Не вдалося змінити стан.')
    } finally { setBusy(null) }
  }

  const openAccess = async (row: Row) => {
    const email = prompt(
      `Пошта контактної особи, яка керуватиме доступом.\n\n` +
      `Ця людина мусить УЖЕ мати обліковий запис на сайті — інакше групі ` +
      `немає кому належати.`,
      row.contact_email,
    )
    if (!email) return
    const months = prompt('На скільки місяців відкриваємо доступ?', '12')
    if (!months) return

    setBusy(row.id); setMsg(null)
    try {
      const r = await fetch('/api/admin/plan-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, ownerEmail: email, months: Number(months) }),
      })
      const d = await r.json()
      if (d.ok) {
        setMsg(
          `Доступ відкрито: ${d.kindLabel}, ${d.seats} місць, до ${fmtDate(d.expiresAt)}.` +
          (d.emailWarning ? ` ${d.emailWarning}` : ' Лист із посиланням на керування надіслано.')
        )
        await load()
      } else {
        setMsg(d.message ?? 'Не вдалося відкрити доступ.')
      }
    } finally { setBusy(null) }
  }

  const wrap: React.CSSProperties = {
    maxWidth: 900, margin: '0 auto', padding: '24px 18px 60px',
    fontFamily: FONT, color: CREAM,
  }

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 24, color: GOLD, margin: '0 0 6px' }}>Заявки на груповий доступ</h1>
      <p style={{ color: MUTED, fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
        Юрособи платять за рахунком, тому доступ відкривається вручну — після
        того, як кошти надійшли. Рахунок і акт виписуються поза сайтом.
      </p>

      {msg && (
        <p role="status" style={{
          fontSize: 14, lineHeight: 1.6, padding: '12px 16px', borderRadius: 9,
          background: 'rgba(239,159,39,0.12)', color: '#FAC775', marginBottom: 18,
        }}>{msg}</p>
      )}

      {loading ? (
        <p style={{ color: MUTED }}>Завантажуємо…</p>
      ) : items.length === 0 ? (
        <p style={{ color: MUTED }}>Заявок поки немає.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((r) => (
            <article key={r.id} style={{
              background: NAVY, border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'baseline', marginBottom: 10 }}>
                <strong style={{ fontSize: 17, flex: '1 1 200px' }}>{r.org_name}</strong>
                <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[r.status] }}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>

              <p style={{ fontSize: 13, color: MUTED, margin: '0 0 4px' }}>
                {KIND_LABEL[r.kind]}
                {r.edrpou && ` · ЄДРПОУ ${r.edrpou}`}
              </p>
              <p style={{ fontSize: 14, margin: '0 0 4px' }}>
                {r.contact_name} · {r.contact_email}
                {r.contact_phone && ` · ${r.contact_phone}`}
              </p>
              <p style={{ fontSize: 12, color: MUTED, margin: '0 0 10px' }}>
                надійшла {fmtDate(r.created_at)}
              </p>

              {r.note && (
                <p style={{
                  fontSize: 14, lineHeight: 1.6, margin: '0 0 12px', padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)', borderRadius: 8, color: '#c8d4e8',
                }}>{r.note}</p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {r.status === 'new' && (
                  <button onClick={() => setStatus(r.id, 'invoiced')} disabled={busy === r.id}
                    style={btnGhost}>Рахунок виставлено</button>
                )}
                {(r.status === 'new' || r.status === 'invoiced') && (
                  <>
                    <button onClick={() => openAccess(r)} disabled={busy === r.id}
                      style={btnGold}>Відкрити доступ</button>
                    <button onClick={() => setStatus(r.id, 'cancelled')} disabled={busy === r.id}
                      style={btnDanger}>Скасувати</button>
                  </>
                )}
                {r.status === 'paid' && (
                  <span style={{ fontSize: 13, color: '#86efac' }}>
                    Група створена. Керування — у власника на /group
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

const btnBase: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
  fontFamily: FONT, cursor: 'pointer',
}
const btnGold: React.CSSProperties = {
  ...btnBase, background: GOLD, color: '#0a1628', border: 'none',
}
const btnGhost: React.CSSProperties = {
  ...btnBase, background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`,
}
const btnDanger: React.CSSProperties = {
  ...btnBase, background: 'transparent', color: '#fca5a5',
  border: '1px solid rgba(248,113,113,0.5)',
}
