'use client'

import { useState } from 'react'
import { trackConversion, sessionSource } from '@/lib/conversion'

const GOLD = '#EF9F27'
const CREAM = '#FFF8EE'
const MUTED = '#B8C6D8'
const GOLD_SOFT = '#E8C48A'
const FIELD: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '.8rem .9rem', fontSize: '1.05rem',
  borderRadius: 10, border: '1px solid rgba(255,255,255,.25)', background: '#0B1626', color: CREAM,
  fontFamily: 'inherit',
}

export default function KlubForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'reader' | 'author' | 'both'>('reader')
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading') return
    setStatus('loading'); setMsg('')
    try {
      const r = await fetch('/api/klub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, consent, website, source: sessionSource() }),
      })
      const d = (await r.json()) as { ok?: boolean; error?: string; isNew?: boolean }
      if (!r.ok || !d.ok) { setStatus('error'); setMsg(d.error ?? 'Не вдалося надіслати'); return }
      if (d.isNew) trackConversion('klub', role)
      setStatus('ok')
    } catch {
      setStatus('error'); setMsg("Немає зв'язку із сайтом. Спробуйте ще раз.")
    }
  }

  if (status === 'ok') {
    return (
      <div role="status" style={{ background: '#13314a', border: `1px solid ${GOLD}`, borderRadius: 14, padding: '1.4rem 1.3rem' }}>
        <p style={{ margin: 0, fontSize: '1.25rem', color: GOLD, fontWeight: 700 }}>Вітаємо в Клубі Балабонів!</p>
        <p style={{ margin: '.6rem 0 0', color: CREAM, fontSize: '1.05rem' }}>
          Перший лист клубу прийде на {email || 'вашу пошту'}. А поки — <a href="/stories" style={{ color: GOLD }}>оберіть історію на вечір</a>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <label htmlFor="klub-name" style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>Як до вас звертатися</label>
        <input id="klub-name" required autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} style={FIELD} />
      </div>
      <div>
        <label htmlFor="klub-email" style={{ display: 'block', marginBottom: '.35rem', fontWeight: 600 }}>Електронна пошта</label>
        <input id="klub-email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} style={FIELD} />
      </div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: '.45rem' }}>Я в клубі як</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
          {([['reader', 'Читач'], ['author', 'Автор'], ['both', 'І те, і те']] as const).map(([v, l]) => (
            <label key={v} style={{
              display: 'inline-flex', alignItems: 'center', gap: '.45rem', padding: '.6rem 1rem', minHeight: 44,
              borderRadius: 999, cursor: 'pointer', border: `1px solid ${role === v ? GOLD : 'rgba(255,255,255,.25)'}`,
              background: role === v ? 'rgba(239,159,39,.15)' : 'transparent',
            }}>
              <input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label>Сайт<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      <label style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', color: MUTED, fontSize: '.98rem' }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 20, height: 20, marginTop: 3 }} />
        <span>Погоджуюся отримувати листи клубу. Відписатися можна будь-коли одним кліком у листі. <a href="/legal/privacy" style={{ color: GOLD }}>Політика конфіденційності</a></span>
      </label>
      {status === 'error' && <p role="alert" style={{ color: '#ffb4a8', margin: 0 }}>{msg}</p>}
      <button type="submit" disabled={!consent || status === 'loading'} style={{
        background: consent ? GOLD : 'transparent', color: consent ? '#2a1a02' : GOLD_SOFT, border: consent ? 0 : `1px solid ${GOLD_SOFT}`, borderRadius: 10, padding: '.95rem 1.4rem',
        fontSize: '1.15rem', fontWeight: 800, cursor: consent ? 'pointer' : 'not-allowed', fontFamily: 'inherit', minHeight: 48,
      }}>
        {status === 'loading' ? 'Надсилаємо…' : 'Вступити до клубу — безкоштовно'}
      </button>
    </form>
  )
}
