'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#f0a500'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'

interface ApproveResponse {
  ok?: boolean
  filename?: string
  error?: string
}

export default function ApprovePage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [filename, setFilename] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/editor/approve?token=${encodeURIComponent(token)}`)
      .then(res => res.json() as Promise<ApproveResponse>)
      .then(data => {
        if (data.ok && data.filename) {
          setFilename(data.filename)
        } else {
          setError(data.error ?? 'Невідома помилка')
        }
      })
      .catch(() => setError("Помилка з'єднання"))
      .finally(() => setLoading(false))
  }, [token])

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
        border: `1px solid rgba(240,165,0,0.25)`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: GOLD, marginBottom: 4 }}>
          Balabony<sup style={{ fontSize: 11 }}>®</sup>
        </div>
        <div style={{ fontSize: 11, color: '#8899bb', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 32 }}>
          Редакція
        </div>

        {loading && (
          <>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            <div style={{ fontSize: 16, color: '#c8d4e8' }}>Обробляємо вашу відповідь…</div>
          </>
        )}

        {!loading && filename && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', marginBottom: 12 }}>
              Дякуємо!
            </div>
            <div style={{ fontSize: 15, color: '#c8d4e8', lineHeight: 1.6 }}>
              Серію <strong style={{ color: GOLD }}>«{filename}»</strong> погоджено.
            </div>
            <div style={{ fontSize: 12, color: '#445566', marginTop: 24 }}>
              Ви отримали цей лист як редактор серіалу «Балабони»
            </div>
          </>
        )}

        {!loading && error && (
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
