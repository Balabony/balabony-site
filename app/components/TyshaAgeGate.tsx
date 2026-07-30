'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const FONT = "'Montserrat', Arial, sans-serif"
const KEY = 'balabony_age_ok'

/**
 * Вікове підтвердження для рубрики «Авторські серіали» (18+).
 *
 * Накладка, а не обгортка: текст лишається в DOM, тож Google індексує
 * вільні серії, а читач без підтвердження нічого не бачить.
 * Вік технічно не перевіряється — це заява користувача, так і написано
 * в політиці захисту дітей.
 *
 * Ключ balabony_age_ok той самий, що вже описаний у політиці cookies.
 */
export default function TyshaAgeGate() {
  // За замовчуванням стіна показана: краще блимнути стіною, ніж текстом 18+
  const [ok, setOk] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') setOk(true)
    } catch {
      /* приватний режим або заблоковане сховище — лишаємо стіну */
    }
  }, [])

  // Поки стіна стоїть — сторінка під нею не прокручується
  useEffect(() => {
    if (ok) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [ok])

  if (ok) return null

  const confirm = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* не змогли запам'ятати — спитаємо наступного разу */
    }
    setOk(true)
  }

  const btnBase = {
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 10,
    padding: '14px 24px',
    cursor: 'pointer',
    fontFamily: FONT,
    lineHeight: 1.2,
  } as const

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tysha-agegate-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px calc(88px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(6,14,28,0.97)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        fontFamily: FONT,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: '100%',
          textAlign: 'center',
          background: NAVY_DEEP,
          border: '1px solid rgba(239,159,39,0.35)',
          borderRadius: 16,
          padding: '36px 26px',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: '#e0484d',
            color: '#fff',
            fontSize: 15,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 8,
            letterSpacing: 0.5,
            marginBottom: 18,
          }}
        >
          18+
        </div>

        <h2
          id="tysha-agegate-title"
          style={{ fontSize: 23, fontWeight: 700, color: '#f5f0e8', margin: '0 0 12px', lineHeight: 1.3 }}
        >
          Вміст для дорослих
        </h2>

        <p style={{ fontSize: 16, lineHeight: 1.65, color: '#c8d4e8', margin: '0 0 26px' }}>
          «Тиша» — авторський серіал про війну. Підтвердіть, будь ласка, що вам виповнилося 18 років.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={confirm} style={{ ...btnBase, color: NAVY_DEEP, background: GOLD, border: 'none' }}>
            Так, мені є 18
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              ...btnBase,
              color: '#c8d4e8',
              background: 'transparent',
              border: '1px solid rgba(200,212,232,0.35)',
            }}
          >
            Ні, повернутися
          </button>
        </div>

        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(200,212,232,0.6)', margin: '22px 0 0' }}>
          Ми не перевіряємо вік технічно — це ваша заява.
        </p>
      </div>
    </div>
  )
}
