'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'


export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [google, setGoogle] = useState(false)
  const [next, setNext] = useState<string | null>(null)

  // Куди повернути після входу. Той самий параметр, який уже розуміє
  // /auth/callback: одноразові посилання з адмінки несуть ?next=/author/dashboard.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('next')
    if (v && v.startsWith('/') && !v.startsWith('//')) setNext(v)
  }, [])

  /**
   * Вхід через Google.
   *
   * Навіщо додано 12.09.2026: вхід був лише за посиланням на пошту — тобто
   * «введи адресу, вийди із сайту, знайди лист, вернися». З 129 дочитувань
   * у базі лише 5 належали акаунтам; решта 124 — гостям із cookie. А
   * незалогінений читач не рахується ні в конкурсах, ні у винагороді
   * авторам за договором, п. 1.5.
   *
   * Обмін коду на сесію робить наявний /auth/callback — той самий, що для
   * посилання з пошти. Тому перенесення історії з cookie, привʼязка
   * реферала й створення рядка в users працюють без змін.
   */
  async function signInWithGoogle() {
    setGoogle(true)
    setErrorMsg('')
    try {
      const supabase = createSupabaseBrowserClient()
      const cb = new URL('/auth/callback', window.location.origin)
      if (next) cb.searchParams.set('next', next)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: cb.toString() },
      })
      if (error) {
        setGoogle(false)
        setErrorMsg('Не вдалося відкрити вхід через Google. Спробуйте посилання на пошту.')
      }
      // Успіх — браузер іде на Google, повертати нічого не треба.
    } catch {
      setGoogle(false)
      setErrorMsg('Не вдалося відкрити вхід через Google. Спробуйте посилання на пошту.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    // Адресу підбирає сервер: у частини авторів акаунт заведений із крапкою
    // в gmail, і сліпа нормалізація на клієнті відправляла їх у порожній
    // кабінет замість власного.
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = (await res.json()) as { ok: boolean; error?: string }
      if (!d.ok) {
        setStatus('error')
        setErrorMsg(d.error ?? 'Не вдалося надіслати лист')
      } else {
        setStatus('sent')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Немає звʼязку з сервером')
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
      background: 'linear-gradient(180deg, #0a1628 0%, #0f1f3a 100%)',
      fontFamily: "'Montserrat', sans-serif",
    }}>
      {/* Логотип зверху */}
      <Link href="/" style={{
        alignSelf: 'flex-start',
        marginBottom: '3rem',
        textDecoration: 'none',
      }}>
        <span style={{
          fontFamily: "'Comfortaa', sans-serif",
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#ef9f27',
          letterSpacing: '-0.5px',
        }}>
          Balabony
          
        </span>
      </Link>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          background: '#ffffff',
          padding: '3rem 2.5rem 2.5rem',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(239, 159, 39, 0.1)',
          position: 'relative',
        }}>
          {/* Декоративний "балабон" */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef9f27 0%, #f4b942 100%)',
            boxShadow: '0 8px 24px rgba(239, 159, 39, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: "'Comfortaa', sans-serif",
            fontWeight: 700,
            fontSize: '1.5rem',
          }}>
            Б
          </div>

          <h1 style={{
            fontFamily: "'Comfortaa', sans-serif",
            fontSize: '1.85rem',
            fontWeight: 700,
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            color: '#0a1628',
            textAlign: 'center',
          }}>
            Вхід на Балабони
          </h1>

          <p style={{
            fontFamily: "'Lora', serif",
            fontStyle: 'italic',
            color: '#6b6354',
            marginBottom: '2rem',
            fontSize: '1rem',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            Одне натискання через Google — або посилання на пошту
          </p>

          {status !== 'sent' && (
            <>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                disabled={google}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '0.85rem 1rem',
                  background: '#ffffff',
                  border: '1.5px solid #dadce0',
                  borderRadius: '10px',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#1f1f1f',
                  cursor: google ? 'default' : 'pointer',
                  opacity: google ? 0.6 : 1,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {google ? 'Відкриваю Google…' : 'Увійти через Google'}
              </button>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                margin: '1.25rem 0', fontSize: '0.85rem',
              }}>
                <span style={{ flex: 1, height: 1, background: '#e5e0d8' }} />
                <span style={{ color: '#9b9384' }}>або</span>
                <span style={{ flex: 1, height: 1, background: '#e5e0d8' }} />
              </div>
            </>
          )}

          {status === 'sent' ? (
            <div style={{
              padding: '1.5rem',
              background: '#fff8e7',
              border: '2px solid #ef9f27',
              borderRadius: '12px',
              color: '#0a1628',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>✉️</div>
              <strong style={{ fontFamily: "'Comfortaa', sans-serif", fontSize: '1.15rem' }}>
                Готово!
              </strong>
              <p style={{ marginTop: '0.75rem', marginBottom: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                Перевір пошту <strong>{email}</strong>.
                <br />
                Посилання дійсне годину.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="email" style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#0a1628',
              }}>
                Електронна пошта
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="імʼя@email.com"
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  border: '2px solid #f0e0c0',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  marginBottom: '1.25rem',
                  boxSizing: 'border-box',
                  fontFamily: "'Montserrat', sans-serif",
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  outline: 'none',
                  color: '#0a1628',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#ef9f27'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 159, 39, 0.18)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#f0e0c0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                disabled={status === 'sending'}
              />

              <button
                type="submit"
                disabled={status === 'sending'}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  background: status === 'sending'
                    ? '#cbb88a'
                    : 'linear-gradient(135deg, #ef9f27 0%, #f4b942 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  fontFamily: "'Comfortaa', sans-serif",
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  boxShadow: status === 'sending'
                    ? 'none'
                    : '0 6px 18px rgba(239, 159, 39, 0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (status !== 'sending') {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 159, 39, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (status !== 'sending') {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(239, 159, 39, 0.4)'
                  }
                }}
              >
                {status === 'sending' ? 'Надсилаємо...' : 'Отримати посилання'}
              </button>

              {status === 'error' && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '10px',
                  color: '#991b1b',
                  fontSize: '0.9rem',
                }}>
                  {errorMsg}
                </div>
              )}
            </form>
          )}

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #f4ecd8',
            textAlign: 'center',
          }}>
            <Link href="/" style={{
              color: '#8b7355',
              fontSize: '0.9rem',
              textDecoration: 'none',
              fontFamily: "'Lora', serif",
              fontStyle: 'italic',
            }}>
              ← Повернутись на головну
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}