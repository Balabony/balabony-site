'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FONT     = "'Montserrat', Arial, sans-serif"
const GOLD     = '#f0a500'
const NAVY     = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/admin/stories')
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Невірний пароль')
      }
    } catch {
      setError("Помилка з'єднання")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="6" y="13" width="16" height="11" rx="2" stroke={NAVY_DEEP} strokeWidth="2" fill="none"/>
              <path d="M9 13 L9 9 Q9 4 14 4 Q19 4 19 9 L19 13" stroke={NAVY_DEEP} strokeWidth="2" fill="none" strokeLinecap="round"/>
              <circle cx="14" cy="19" r="2" fill={NAVY_DEEP}/>
            </svg>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 6, fontFamily: FONT }}>Адмін панель</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>Вхід</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ background: NAVY, borderRadius: 16, padding: '24px 20px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, fontFamily: FONT }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Введіть пароль..."
              autoFocus
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 10, padding: '12px 14px', color: '#f5f0e8',
                fontSize: 15, fontFamily: FONT, outline: 'none',
                boxSizing: 'border-box', marginBottom: error ? 12 : 20,
              }}
            />
            {error && (
              <div style={{ fontSize: 13, color: '#f87171', marginBottom: 16, padding: '8px 12px', background: 'rgba(239,68,68,0.09)', borderRadius: 8, fontFamily: FONT }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%', background: loading || !password ? 'rgba(240,165,0,0.45)' : GOLD,
                color: NAVY_DEEP, border: 'none', borderRadius: 10,
                padding: '13px', fontSize: 15, fontWeight: 700,
                cursor: loading || !password ? 'default' : 'pointer', fontFamily: FONT,
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Входимо…' : 'Увійти'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
