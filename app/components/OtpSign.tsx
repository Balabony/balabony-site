'use client'

// 08.11.2026 (рішення засновника «спростити підписання онлайн»): підпис договору кодом з пошти — у кабінеті
// і на сторінці персонального посилання /pidpys/…. Три кроки на одному екрані: «Погоджуюсь» → код на пошту → 6 цифр.
import { useEffect, useRef, useState } from 'react'

const GOLD = '#ef9f27'

export default function OtpSign({
  contractId, token, pendingCount = 0, docUrl, light = false, onSigned,
}: {
  contractId: string
  token?: string
  pendingCount?: number
  docUrl?: string | null
  light?: boolean
  onSigned?: (number: string) => void
}) {
  const ink = light ? '#16202e' : '#f5f0e8'
  const muted = light ? '#4a5568' : '#b9c6db'
  const line = light ? '#d8dee8' : 'rgba(143,163,196,0.3)'
  const [agree, setAgree] = useState(false)
  const [clean, setClean] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')
  const [wait, setWait] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t) }, [wait])

  const post = async (url: string, body: object) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractId, token, ...body }) })
    const raw = await res.text()
    try { return JSON.parse(raw) as { ok: boolean; error?: string; to?: string; number?: string } } catch { return { ok: false, error: `Помилка сервера (код ${res.status}). Спробуйте ще раз.` } }
  }

  const send = async () => {
    if (!agree) { setErr('Спершу поставте позначку «Я прочитав(ла) договір і погоджуюсь».'); return }
    setBusy(true); setErr('')
    try {
      const d = await post('/api/contracts/sign/otp/send', {})
      if (!d.ok) { setErr(d.error || 'Не вдалося надіслати код.'); return }
      setSentTo(d.to || 'вашу пошту'); setWait(60)
      setTimeout(() => codeRef.current?.focus(), 50)
    } catch { setErr('Немає звʼязку з сайтом. Перевірте інтернет і спробуйте ще раз.') } finally { setBusy(false) }
  }

  const verify = async () => {
    setBusy(true); setErr('')
    try {
      const d = await post('/api/contracts/sign/otp/verify', { code, agree, worksClean: clean })
      if (!d.ok) { setErr(d.error || 'Не вдалося підписати.'); return }
      setDone(d.number || ''); onSigned?.(d.number || '')
    } catch { setErr('Немає звʼязку з сайтом. Спробуйте ще раз — код діє 15 хвилин.') } finally { setBusy(false) }
  }

  const box: React.CSSProperties = { border: `2px solid ${GOLD}`, borderRadius: 14, padding: '16px 18px', marginTop: 14, background: light ? '#fffaf0' : 'rgba(239,159,39,0.07)', fontFamily: "'Montserrat', Arial, sans-serif" }
  const btn: React.CSSProperties = { background: GOLD, color: '#0a1628', border: 'none', borderRadius: 10, padding: '13px 20px', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }
  const chk: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', color: ink, fontSize: 15.5, lineHeight: 1.5, margin: '0 0 10px', cursor: 'pointer' }

  if (done) {
    return (
      <div style={{ ...box, borderColor: '#4caf50', background: light ? '#effaf1' : 'rgba(76,175,80,0.1)' }} role="status">
        <div style={{ fontSize: 19, fontWeight: 800, color: light ? '#1b5e20' : '#9be7a6', marginBottom: 6 }}>Договір № {done} підписано</div>
        <p style={{ color: ink, margin: 0, lineHeight: 1.6 }}>Копію договору ми надіслали на Вашу пошту. Дякуємо, що Ви з Балабонами!</p>
      </div>
    )
  }

  return (
    <div style={box}>
      <div style={{ fontSize: 18, fontWeight: 800, color: ink, marginBottom: 4 }}>Підписати кодом з пошти — 1 хвилина</div>
      <p style={{ color: muted, fontSize: 14.5, margin: '0 0 14px', lineHeight: 1.5 }}>
        Без ключів і застосунків: ми надішлемо 6 цифр на Вашу пошту, Ви введете їх тут — і договір підписано. Такий підпис має силу письмового (п. 16.1 договору, ст. 12 Закону «Про електронну комерцію»).
      </p>

      <label style={chk}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 22, height: 22, marginTop: 1, accentColor: GOLD, flex: 'none' }} />
        <span>Я прочитав(ла) <a href={docUrl || `/author/contract/${contractId}`} target="_blank" rel="noreferrer" style={{ color: light ? '#b26f00' : GOLD, fontWeight: 700 }}>договір</a> і погоджуюсь з його умовами.</span>
      </label>
      {pendingCount > 0 && (
        <label style={chk}>
          <input type="checkbox" checked={clean} onChange={(e) => setClean(e.target.checked)} style={{ width: 22, height: 22, marginTop: 1, accentColor: GOLD, flex: 'none' }} />
          <span>Мої твори в переліку ({pendingCount}) раніше не публікувалися деінде, крім газет Видавця, і аудіоверсій до них ніхто не створював — підтверджую їх усі.
            <small style={{ display: 'block', color: muted, fontSize: 13 }}>Якщо якийсь твір публікувався в інших виданнях чи на сайтах — не ставте позначку, а позначте такі твори в переліку пізніше. Підписанню це не заважає.</small>
          </span>
        </label>
      )}

      {!sentTo ? (
        <button type="button" onClick={() => void send()} disabled={busy} style={{ ...btn, opacity: busy ? 0.6 : 1, marginTop: 4 }}>{busy ? 'Надсилаємо…' : 'Надіслати код на пошту'}</button>
      ) : (
        <div style={{ marginTop: 6 }}>
          <p style={{ color: ink, margin: '0 0 8px', fontSize: 15 }}>Код надіслано на <b>{sentTo}</b>. Перевірте також «Спам» і «Промоакції».</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <label htmlFor={`otp-${contractId}`} style={{ position: 'absolute', left: -9999 }}>Код з листа</label>
            <input
              id={`otp-${contractId}`} ref={codeRef} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" autoComplete="one-time-code" placeholder="6 цифр"
              onKeyDown={(e) => { if (e.key === 'Enter' && code.length === 6) void verify() }}
              style={{ fontSize: 26, letterSpacing: 6, width: 190, padding: '10px 14px', borderRadius: 10, border: `2px solid ${line}`, background: light ? '#fff' : '#0a1628', color: ink, fontFamily: 'monospace' }}
            />
            <button type="button" onClick={() => void verify()} disabled={busy || code.length !== 6} style={{ ...btn, opacity: busy || code.length !== 6 ? 0.55 : 1 }}>{busy ? 'Перевіряємо…' : 'Підписати договір'}</button>
          </div>
          <button type="button" onClick={() => void send()} disabled={busy || wait > 0} style={{ background: 'none', border: 'none', padding: 0, marginTop: 10, color: wait > 0 ? muted : (light ? '#b26f00' : GOLD), textDecoration: 'underline', cursor: wait > 0 ? 'default' : 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
            {wait > 0 ? `Надіслати код ще раз — через ${wait} с` : 'Надіслати код ще раз'}
          </button>
        </div>
      )}
      {err && <p role="alert" style={{ color: light ? '#b42318' : '#F09595', fontSize: 14.5, margin: '10px 0 0' }}>{err}</p>}
    </div>
  )
}
