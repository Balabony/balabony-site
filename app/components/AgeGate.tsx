'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      setOk(localStorage.getItem('balabony_age_ok') === '1')
    } catch {
      setOk(false)
    }
  }, [])

  // Поки перевіряємо згоду — нічого не показуємо (уникаємо миготіння тексту)
  if (ok === null) return null
  if (ok) return <>{children}</>

  const confirm = () => {
    try { localStorage.setItem('balabony_age_ok', '1') } catch { /* ignore */ }
    setOk(true)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 320, padding: '40px 20px',
      background: 'rgba(224,72,77,0.06)', border: '1px solid rgba(224,72,77,0.30)',
      borderRadius: 16, fontFamily: FONT, textAlign: 'center',
    }}>
      <div style={{ maxWidth: 420 }}>
        <div style={{
          display: 'inline-block', background: '#e0484d', color: '#fff',
          fontSize: 15, fontWeight: 800, padding: '4px 12px', borderRadius: 8,
          letterSpacing: 0.5, marginBottom: 18,
        }}>18+</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f5f0e8', margin: '0 0 10px' }}>
          Вміст для дорослих
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#c8d4e8', margin: '0 0 24px' }}>
          Цей матеріал призначений для повнолітніх. Підтвердіть, будь ласка, що вам виповнилося 18 років.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={confirm}
            style={{
              fontSize: 15, fontWeight: 700, color: '#0a1628', background: GOLD,
              border: 'none', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Так, мені є 18
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              fontSize: 15, fontWeight: 700, color: '#c8d4e8', background: 'transparent',
              border: '1px solid rgba(200,212,232,0.3)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Ні, повернутися
          </button>
        </div>
      </div>
    </div>
  )
}
