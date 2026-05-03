'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#f0a500'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'

interface SubmissionData {
  filename: string
  text: string
  editorName: string
  alreadyResponded: boolean
}

interface SubmissionResponse extends Partial<SubmissionData> {
  error?: string
}

export default function RevisePage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SubmissionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revisedText, setRevisedText] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`/api/editor/submission?token=${encodeURIComponent(token)}`)
      .then(res => res.json() as Promise<SubmissionResponse>)
      .then(res => {
        if (res.error) {
          setError(res.error)
        } else if (res.filename && res.text && res.editorName !== undefined) {
          const d: SubmissionData = {
            filename: res.filename,
            text: res.text,
            editorName: res.editorName ?? '',
            alreadyResponded: res.alreadyResponded ?? false,
          }
          setData(d)
          setRevisedText(d.text)
        }
      })
      .catch(() => setError("Помилка з'єднання"))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!revisedText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/editor/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, revisedText, comment: comment || undefined }),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (json.ok) {
        setSubmitted(true)
      } else {
        setError(json.error ?? 'Помилка при відправці')
      }
    } catch {
      setError("Помилка з'єднання")
    } finally {
      setSubmitting(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: NAVY_DEEP,
    fontFamily: FONT,
    padding: '24px 16px 80px',
  }

  const cardStyle: React.CSSProperties = {
    maxWidth: 760,
    margin: '0 auto',
    background: NAVY,
    borderRadius: 20,
    padding: '32px 28px',
    border: `1px solid rgba(240,165,0,0.2)`,
  }

  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 16, color: '#c8d4e8', fontFamily: FONT }}>Завантажуємо серію…</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171', marginBottom: 12 }}>Помилка</div>
          <div style={{ fontSize: 15, color: '#c8d4e8' }}>{error}</div>
        </div>
      </div>
    )
  }

  if (!data) return null

  if (data.alreadyResponded) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', marginBottom: 12 }}>Вже відповіли</div>
          <div style={{ fontSize: 15, color: '#c8d4e8' }}>Ви вже надіслали відповідь для цієї серії.</div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80', marginBottom: 12 }}>Правки надіслано!</div>
          <div style={{ fontSize: 15, color: '#c8d4e8' }}>
            Дякуємо, <strong style={{ color: '#f5f0e8' }}>{data.editorName}</strong>.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ fontSize: 22, fontWeight: 700, color: GOLD, marginBottom: 4 }}>
          Balabony<sup style={{ fontSize: 11 }}>®</sup>
        </div>
        <div style={{ fontSize: 11, color: '#8899bb', letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 24 }}>
          Редакція
        </div>

        <div style={{ fontSize: 14, color: '#c8d4e8', marginBottom: 6 }}>
          Вітаємо, <strong style={{ color: '#f5f0e8' }}>{data.editorName}</strong>!
        </div>
        <div style={{ fontSize: 14, color: '#c8d4e8', marginBottom: 24 }}>
          Серія <strong style={{ color: GOLD }}>{data.filename}</strong> — відредагуйте текст нижче та натисніть «Надіслати правки».
        </div>

        {/* Original text readonly */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 8 }}>
            Оригінальний текст:
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: 13,
            color: '#8899bb',
            lineHeight: 1.7,
            maxHeight: 200,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {data.text}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 8 }}>
              Відредагований текст:
            </label>
            <textarea
              value={revisedText}
              onChange={e => setRevisedText(e.target.value)}
              rows={16}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#f5f0e8',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                lineHeight: 1.7,
              }}
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 8 }}>
              Коментар (необов&apos;язково):
            </label>
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Поясніть що і чому змінили…"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#f5f0e8',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !revisedText.trim()}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: submitting ? 'rgba(240,165,0,0.4)' : GOLD,
              color: '#081420',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: FONT,
              cursor: submitting ? 'wait' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {submitting ? '⏳ Надсилаємо…' : '✏️ Надіслати правки'}
          </button>
        </form>
      </div>
    </div>
  )
}
