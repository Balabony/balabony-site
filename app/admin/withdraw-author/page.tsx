'use client'

import { useState } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'
const BAD = '#E88686'

/**
 * Зняття творів автора з сайту.
 *
 * Сторінка навмисно порожня і незручна для випадкового натискання: спершу
 * підрахунок, потім окреме підтвердження. Це аварійний інструмент, а не
 * частина щоденної роботи.
 */
export default function WithdrawAuthorPage() {
  const [name, setName] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')

  const call = async (action: 'count' | 'withdraw') => {
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/admin/withdraw-author', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: name.trim(), action }),
      })
      const d = (await res.json()) as {
        ok: boolean; error?: string; count?: number; withdrawn?: number
      }
      if (!d.ok) {
        setErr(d.error ?? 'Не вдалося виконати')
        return
      }
      if (action === 'count') {
        setCount(d.count ?? 0)
        setDone('')
      } else {
        setDone(`Знято з сайту: ${d.withdrawn ?? 0}. Тексти збережені в чернетках.`)
        setCount(null)
        setName('')
      }
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setBusy(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 10,
    border: `1px solid ${LINE}`, background: NAVY_DEEP, color: CREAM,
    fontSize: 15, fontFamily: FONT, outline: 'none',
  }

  return (
    <main style={{ background: NAVY_DEEP, minHeight: '100vh', color: CREAM, fontFamily: FONT }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 90px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ color: GOLD, fontSize: 26, margin: 0 }}>Зняти твори автора</h1>
          <a href="/admin" style={{ color: MUTED, fontSize: 14, textDecoration: 'none' }}>← В адмінку</a>
        </div>

        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, marginTop: 14 }}>
          Якщо автор просить прибрати свої тексти з сайту. Усі його твори повертаються
          в чернетки й зникають із публічних сторінок. Нічого не видаляється —
          повернути назад можна тим самим способом, що й публікували.
          Імʼя вводьте точно так, як воно стоїть у картці твору.
        </p>

        <div style={{ marginTop: 22 }}>
          <label style={{ display: 'block', fontSize: 13, color: MUTED, marginBottom: 6, fontWeight: 600 }}>
            Імʼя автора
          </label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setCount(null); setDone('') }}
            placeholder="Ірина Агафонова-Ясінська"
            style={inputStyle}
          />
        </div>

        <button
          onClick={() => void call('count')}
          disabled={busy || name.trim().length < 3}
          style={{
            marginTop: 16, padding: '11px 22px', borderRadius: 10,
            border: `1px solid ${LINE}`, background: NAVY, color: CREAM,
            fontSize: 14, fontWeight: 700, fontFamily: FONT,
            cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Рахую…' : 'Порахувати'}
        </button>

        {err && (
          <p style={{ color: BAD, fontSize: 14, marginTop: 16 }}>{err}</p>
        )}

        {count !== null && (
          <div style={{
            marginTop: 20, padding: '16px 18px', borderRadius: 12,
            background: NAVY, border: `1px solid ${count > 0 ? BAD : LINE}`,
          }}>
            {count > 0 ? (
              <>
                <p style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 14px' }}>
                  З сайту зникне <b>{count}</b> творів автора <b>{name.trim()}</b>.
                  Читачі перестануть їх бачити одразу.
                </p>
                <button
                  onClick={() => void call('withdraw')}
                  disabled={busy}
                  style={{
                    padding: '11px 22px', borderRadius: 10, border: 'none',
                    background: BAD, color: '#10151f', fontSize: 14,
                    fontWeight: 700, fontFamily: FONT,
                    cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
                  }}
                >
                  {busy ? 'Знімаю…' : 'Зняти з сайту'}
                </button>
              </>
            ) : (
              <p style={{ fontSize: 15, margin: 0, color: MUTED }}>
                Опублікованих творів із таким імʼям немає. Перевірте написання —
                воно має збігатися з тим, що стоїть у картці твору.
              </p>
            )}
          </div>
        )}

        {done && (
          <p style={{
            marginTop: 20, padding: '14px 16px', borderRadius: 12,
            background: 'rgba(239,159,39,0.10)', border: `1px solid ${GOLD}`,
            fontSize: 15, lineHeight: 1.6,
          }}>
            {done}
          </p>
        )}

      </div>
    </main>
  )
}
