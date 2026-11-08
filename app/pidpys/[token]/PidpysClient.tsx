'use client'
// 08.11.2026: клієнтська частина сторінки /pidpys/<токен> — 4 поля (якщо бракує) і підпис кодом з пошти.
import { useState } from 'react'
import OtpSign from '@/app/components/OtpSign'

type Init = { fullName: string; rnokpp: string; birthDate: string; phone: string; isFop: boolean }

export default function PidpysClient({ token, needRequisites, missing, initial, contractId, signed, pending, compact }: {
  token: string; needRequisites: boolean; missing: string[]; initial: Init | null
  contractId: string | null; signed: boolean; pending: number; compact?: boolean
}) {
  const [f, setF] = useState<Init>(initial ?? { fullName: '', rnokpp: '', birthDate: '', phone: '', isFop: false })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (signed) return compact ? null : <p style={{ fontSize: 17, fontFamily: 'Arial, sans-serif' }}>Дякуємо! Підписаний договір завжди доступний у <a href="/author/dashboard">кабінеті автора</a>.</p>

  if (needRequisites) {
    const save = async () => {
      setBusy(true); setErr('')
      try {
        const res = await fetch('/api/pidpys/requisites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...f }) })
        const d = await res.json().catch(() => ({ ok: false, error: `Помилка сервера (код ${res.status})` })) as { ok: boolean; error?: string }
        if (!d.ok) { setErr(d.error || 'Не вдалося зберегти'); return }
        window.location.reload()
      } catch { setErr('Немає звʼязку з сайтом. Спробуйте ще раз.') } finally { setBusy(false) }
    }
    const inp: React.CSSProperties = { width: '100%', fontSize: 17, padding: '11px 12px', borderRadius: 10, border: '1.5px solid #c9d1dd', boxSizing: 'border-box', fontFamily: 'inherit' }
    const lab: React.CSSProperties = { display: 'block', fontWeight: 700, fontSize: 15, margin: '12px 0 5px' }
    return (
      <div style={{ border: '2px solid #ef9f27', borderRadius: 14, padding: '16px 18px', background: '#fffaf0', fontFamily: "'Montserrat', Arial, sans-serif" }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Крок 1. Про Вас — 4 поля</div>
        {missing.length > 0 && <p style={{ margin: '4px 0 0', color: '#4a5568', fontSize: 14 }}>Ці дані потрібні, щоб договір був укладений саме з Вами. Банківський рахунок і адресу впишете пізніше в кабінеті — перед першою виплатою.</p>}
        <label style={lab} htmlFor="pp-n">Прізвище, імʼя, по батькові</label>
        <input id="pp-n" style={inp} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} autoComplete="name" placeholder="Шевченко Тарас Григорович" />
        <label style={lab} htmlFor="pp-r">РНОКПП (ідентифікаційний код, 10 цифр)</label>
        <input id="pp-r" style={inp} value={f.rnokpp} onChange={(e) => setF({ ...f, rnokpp: e.target.value })} inputMode="numeric" />
        <label style={lab} htmlFor="pp-b">Дата народження</label>
        <input id="pp-b" style={inp} type="date" value={f.birthDate} onChange={(e) => setF({ ...f, birthDate: e.target.value })} />
        <label style={lab} htmlFor="pp-p">Телефон</label>
        <input id="pp-p" style={inp} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="050 123 45 67" />
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, fontSize: 15 }}>
          <input type="checkbox" checked={f.isFop} onChange={(e) => setF({ ...f, isFop: e.target.checked })} style={{ width: 20, height: 20 }} /> Я — фізична особа — підприємець (ФОП)
        </label>
        <button type="button" onClick={() => void save()} disabled={busy} style={{ marginTop: 14, background: '#ef9f27', color: '#0a1628', border: 'none', borderRadius: 10, padding: '13px 20px', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
          {busy ? 'Зберігаємо…' : 'Далі — до договору'}
        </button>
        {err && <p role="alert" style={{ color: '#b42318', margin: '10px 0 0' }}>{err}</p>}
      </div>
    )
  }
  if (!contractId) return null
  if (!compact) return <a href="#pidpys" style={{ display: 'inline-block', background: '#ef9f27', color: '#0a1628', borderRadius: 10, padding: '12px 18px', fontWeight: 800, textDecoration: 'none', fontFamily: 'Arial, sans-serif' }}>Одразу до підпису ↓</a>
  return <OtpSign contractId={contractId} token={token} pendingCount={pending} docUrl="#dogovir" light onSigned={() => setTimeout(() => window.location.reload(), 2500)} />
}
