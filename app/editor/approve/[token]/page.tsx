'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = 'var(--accent-gold)'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'

interface InfoResponse {
  ok?: boolean
  filename?: string | null
  alreadyResponded?: boolean
  error?: string
}

// 23.10.2026: сторінка більше НЕ схвалює твір сама при відкритті.
// Спершу показує, що буде погоджено, і схвалює лише після натискання кнопки.
type Stage = 'loading' | 'confirm' | 'submitting' | 'done' | 'already' | 'error'

export default function ApprovePage() {
  const params = useParams()
  const token = params.token as string

  const [stage, setStage] = useState<Stage>('loading')
  const [filename, setFilename] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Крок 1: лише дізнаємось, що це за твір (без зміни стану).
  useEffect(() => {
    if (!token) return
    fetch(`/api/editor/approve?token=${encodeURIComponent(token)}`)
      .then((res) => res.json() as Promise<InfoResponse>)
      .then((data) => {
        if (!data.ok) {
          setError(data.error ?? 'Невідома помилка')
          setStage('error')
          return
        }
        setFilename(data.filename ?? null)
        setStage(data.alreadyResponded ? 'already' : 'confirm')
      })
      .catch(() => {
        setError("Помилка з'єднання")
        setStage('error')
      })
  }, [token])

  // Крок 2: схвалення — лише за кнопкою.
  function approve() {
    setStage('submitting')
    fetch('/api/editor/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json() as Promise<InfoResponse>)
      .then((data) => {
        if (data.ok) {
          if (data.filename) setFilename(data.filename)
          setStage('done')
        } else {
          setError(data.error ?? 'Невідома помилка')
          setStage('error')
        }
      })
      .catch(() => {
        setError("Помилка з'єднання")
        setStage('error')
      })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: NAVY_DEEP,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT,
      padding: '24px 16px',
    }}>
      <div style={{
        background: NAVY,
        borderRadius: 20,
        padding: '40px 36px',
        maxWidth: 480,
        width: '100%',
        border: `1px solid rgba(239,159,39,0.25)`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: GOLD, marginBottom: 4 }}>
          Balabony
        </div>
        <div style={{ fontSize: 11, color: '#8899bb', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 32 }}>
          Редакція
        </div>

        {stage === 'loading' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 16, color: '#c8d4e8' }}>Завантажуємо серію…</div>
          </>
        )}

        {stage === 'confirm' && (
          <>
            <div style={{ fontSize: 15, color: '#c8d4e8', lineHeight: 1.6, marginBottom: 24 }}>
              Погодити серію{filename ? <> <strong style={{ color: GOLD }}>«{filename}»</strong></> : null}?
            </div>
            <button
              onClick={approve}
              style={{
                background: GOLD,
                color: NAVY_DEEP,
                border: 'none',
                borderRadius: 12,
                padding: '14px 28px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              Схвалити
            </button>
            <div style={{ fontSize: 12, color: '#445566', marginTop: 24 }}>
              Поки ви не натиснете «Схвалити», нічого не змінюється.
            </div>
          </>
        )}

        {stage === 'submitting' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 16, color: '#c8d4e8' }}>Зберігаємо…</div>
          </>
        )}

        {stage === 'done' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', marginBottom: 12 }}>
              Дякуємо!
            </div>
            <div style={{ fontSize: 15, color: '#c8d4e8', lineHeight: 1.6 }}>
              Серію{filename ? <> <strong style={{ color: GOLD }}>«{filename}»</strong></> : null} погоджено.
            </div>
            <div style={{ fontSize: 12, color: '#445566', marginTop: 24 }}>
              Ви отримали цей лист як редактор серіалу «Балабони»
            </div>
          </>
        )}

        {stage === 'already' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>ℹ️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: GOLD, marginBottom: 12 }}>
              Уже відповіли
            </div>
            <div style={{ fontSize: 15, color: '#c8d4e8', lineHeight: 1.6 }}>
              По цій серії{filename ? <> <strong style={{ color: GOLD }}>«{filename}»</strong></> : null} ви вже дали відповідь.
            </div>
          </>
        )}

        {stage === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171', marginBottom: 12 }}>
              Помилка
            </div>
            <div style={{ fontSize: 15, color: '#c8d4e8', lineHeight: 1.6 }}>
              {error}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
