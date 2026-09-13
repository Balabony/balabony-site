'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = 'var(--accent-gold)'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'

const ERRORS: Record<string, string> = {
  'no-token': 'Посилання неповне. Замовте новий лист.',
  'expired': 'Посилання вже використане або протерміноване. Замовте новий лист.',
  'server': 'Не вдалося увійти. Спробуйте ще раз за хвилину.',
}

function LoginForm() {
  const params = useSearchParams()
  const linkError = ERRORS[params.get('error') ?? ''] ?? null

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!email.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/editor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (data.ok) setSent(true)
      else setError(data.error ?? 'Не вдалося надіслати лист')
    } catch {
      setError("Помилка з'єднання")
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: NAVY_DEEP, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, padding: '24px 16px',
    }}>
      <div style={{
        background: NAVY, borderRadius: 20, padding: '40px 36px',
        maxWidth: 460, width: '100%',
        border: '1px solid rgba(239,159,39,0.25)',
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>Balabony</div>
        <div style={{
          fontSize: 11, color: '#8899bb', letterSpacing: 2,
          textTransform: 'uppercase', marginBottom: 24,
        }}>
          Кабінет редактора
        </div>

        {sent ? (
          <p style={{ color: '#c8d4e8', lineHeight: 1.7, margin: 0 }}>
            Якщо ця пошта є в списку редакції, лист із посиланням уже вирушив.
            Перевірте скриньку — посилання дійсне годину.
          </p>
        ) : (
          <>
            <p style={{ color: '#c8d4e8', lineHeight: 1.7, marginBottom: 20 }}>
              Введіть пошту, на яку вас записано в редакцію. Надішлемо
              посилання для входу — пароля не потрібно.
            </p>

            {linkError && (
              <p style={{ color: '#ffb4a2', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                {linkError}
              </p>
            )}

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder="пошта редактора"
              autoComplete="email"
              style={{
                width: '100%', padding: '13px 15px', borderRadius: 10,
                border: '1px solid rgba(239,159,39,0.3)', background: NAVY_DEEP,
                color: '#f5f0e8', fontSize: 15, fontFamily: FONT,
                marginBottom: 14, boxSizing: 'border-box',
              }}
            />

            <button
              onClick={submit}
              disabled={sending}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 10, border: 'none',
                background: GOLD, color: '#081420', fontWeight: 700, fontSize: 16,
                fontFamily: FONT, cursor: sending ? 'default' : 'pointer',
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? 'Надсилаємо…' : 'Надіслати посилання'}
            </button>

            {error && (
              <p style={{ color: '#ffb4a2', fontSize: 14, marginTop: 14, marginBottom: 0 }}>
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function EditorLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
