'use client'

import { useState } from 'react'

const GOLD = '#EF9F27'
const NAVY = '#14253B'
const CREAM = '#FFF8EE'
const FONT = "'Montserrat', Arial, sans-serif"

export default function EmailCapture() {
  const [email,   setEmail]   = useState('')
  const [consent, setConsent] = useState(true)
  const [website, setWebsite] = useState('') // honeypot
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (status === 'loading') return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error'); setMessage('Перевірте формат email'); return
    }
    if (!consent) {
      setStatus('error'); setMessage('Потрібна згода на отримання листів'); return
    }
    setStatus('loading'); setMessage('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), consent, website, source: 'homepage' }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setStatus('ok'); setMessage('Готово! Перевірте пошту — ми надіслали вітання.')
        setEmail('')
      } else {
        setStatus('error'); setMessage(data.error ?? 'Не вдалося підписатися')
      }
    } catch {
      setStatus('error'); setMessage("Помилка з'єднання. Спробуйте ще раз.")
    }
  }

  return (
    <section style={{ padding: '48px 16px' }}>
      <div style={{
        maxWidth: 720, margin: '0 auto',
        background: `linear-gradient(135deg, ${NAVY} 0%, #0E1A2B 100%)`,
        border: `1px solid ${GOLD}33`, borderRadius: 20,
        padding: '36px 28px', textAlign: 'center', fontFamily: FONT,
      }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>🌻</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: CREAM, margin: '0 0 10px' }}>
          Не пропустіть нову серію
        </h2>
        <p style={{ fontSize: 15, color: '#B5D4F4', lineHeight: 1.6, margin: '0 0 22px' }}>
          Залиште пошту — і першими отримуйте анонси нових історій та серій,
          квести-загадки від Діда&nbsp;Панаса з балами за відповіді та новини про подарункові сертифікати.
        </p>

        {status === 'ok' ? (
          <div style={{
            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.4)',
            borderRadius: 12, padding: '16px 18px', color: '#9ae6b4', fontSize: 15, fontWeight: 600,
          }}>
            {message}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                onKeyDown={e => { if (e.key === 'Enter') submit() }}
                placeholder="ваш@email.com"
                style={{
                  flex: '1 1 260px', minWidth: 0, fontSize: 15, fontFamily: FONT,
                  color: CREAM, background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${GOLD}55`, borderRadius: 12, padding: '13px 16px', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={submit}
                disabled={status === 'loading'}
                style={{
                  flex: '0 0 auto', fontSize: 15, fontWeight: 800, fontFamily: FONT,
                  color: '#1a1205', background: status === 'loading' ? '#caa24a' : GOLD,
                  border: 'none', borderRadius: 12, padding: '13px 28px',
                  cursor: status === 'loading' ? 'default' : 'pointer',
                }}>
                {status === 'loading' ? 'Хвилинку…' : 'Підписатися'}
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14, textAlign: 'left', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                style={{ marginTop: 3, accentColor: GOLD, width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, color: '#8aa3c0', lineHeight: 1.5 }}>
                Погоджуюся отримувати листи від Балабонів. Відписатися можна будь-коли.
              </span>
            </label>

            {/* honeypot — приховане поле для ботів */}
            <input
              type="text" tabIndex={-1} autoComplete="off"
              value={website} onChange={e => setWebsite(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              aria-hidden="true"
            />

            {status === 'error' && (
              <div style={{ fontSize: 13, color: '#fca5a5', marginTop: 10 }}>{message}</div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
