'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
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
            Залиш email — пришлемо чарівне посилання
          </p>

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