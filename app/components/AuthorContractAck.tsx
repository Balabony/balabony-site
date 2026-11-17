'use client'

import { useState, type CSSProperties } from 'react'

/**
 * Згода автора з новою редакцією договору (v8.8, п. 8.11 про ШІ).
 * Не блокує нічого: лише фіксує версію й час, коли автор ознайомився.
 */
export default function AuthorContractAck({ revision, revisionDate }: { revision: string; revisionDate: string }) {
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/author/contract-ack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || 'Не вдалося зберегти')
      setDone(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не вдалося зберегти')
    } finally {
      setBusy(false)
    }
  }

  const box: CSSProperties = {
    margin: '18px 0', padding: '16px 18px', borderRadius: 12,
    border: '1px solid rgba(239,159,39,0.6)', background: 'rgba(239,159,39,0.08)',
    color: '#e8eef7', fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '0.92rem', lineHeight: 1.65,
  }

  if (done) {
    return <div style={box}>Дякуємо! Ви ознайомилися з договором {revision}. Збережено.</div>
  }

  return (
    <div style={box}>
      <div style={{ fontWeight: 700, color: '#ef9f27', marginBottom: 6 }}>
        Оновлено авторський договір — {revision} від {revisionDate}
      </div>
      <div>
        Змінився п. 8.11 про штучний інтелект: твори перевіряють дві незалежні системи, автор має 14 днів,
        щоб переписати твір або підтвердити авторство, а після двох підтверджених порушень втрачає право
        публікувати нові твори й брати участь у конкурсах.{' '}
        <a href="/legal/author-contract" target="_blank" rel="noopener" style={{ color: '#ef9f27', fontWeight: 700 }}>
          Прочитати договір
        </a>
      </div>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ marginTop: 4 }} />
        <span>Я ознайомився(лась) із новою редакцією договору {revision} і погоджуюсь із нею.</span>
      </label>
      <button
        type="button" disabled={!checked || busy} onClick={save}
        style={{
          marginTop: 12, padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 700,
          background: checked ? '#ef9f27' : 'rgba(143,163,196,0.3)', color: '#0f1e3a',
          cursor: checked && !busy ? 'pointer' : 'not-allowed',
        }}
      >
        {busy ? 'Зберігаємо…' : 'Підтвердити'}
      </button>
      {err && <div style={{ color: '#ff9c8f', marginTop: 8 }}>{err}</div>}
    </div>
  )
}
