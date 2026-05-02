'use client'

import { useState } from 'react'

export interface ReviewModalProps {
  contentType: 'series' | 'story'
  contentId: string
  authorId?: string
  authorName?: string
  contentTitle?: string
  onClose: () => void
}

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#FFB800'
const NAVY = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'anon'
  let id = localStorage.getItem('balabony_user_id')
  if (!id) {
    id = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('balabony_user_id', id)
  }
  return id
}

function saveToLocalStorage(review: object) {
  try {
    const raw = localStorage.getItem('balabony_reviews') ?? '[]'
    const list = JSON.parse(raw) as object[]
    list.unshift({ ...review, createdAt: new Date().toISOString() })
    localStorage.setItem('balabony_reviews', JSON.stringify(list.slice(0, 200)))
  } catch {}
}

export default function ReviewModal({
  contentType, contentId, authorId, authorName, contentTitle, onClose,
}: ReviewModalProps) {
  const [rating,  setRating]  = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  const title = contentType === 'series' ? 'Як тобі ця серія?' : 'Як тобі ця історія?'

  const handleSubmit = async () => {
    if (rating === 0) return
    setLoading(true)
    setError('')
    const payload = {
      contentType, contentId,
      authorId:  authorId  ?? null,
      rating,
      comment:   comment.trim() || null,
      userId:    getOrCreateUserId(),
    }
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        saveToLocalStorage(payload)
        setDone(true)
        setTimeout(onClose, 2000)
      } else {
        saveToLocalStorage(payload)
        setDone(true)
        setTimeout(onClose, 2000)
      }
    } catch {
      saveToLocalStorage(payload)
      setDone(true)
      setTimeout(onClose, 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{
        background: NAVY, border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 420,
        textAlign: 'center', fontFamily: FONT, position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
            color: '#f5f0e8', width: 30, height: 30, cursor: 'pointer', fontSize: 15, lineHeight: 1,
          }}
        >✕</button>

        {done ? (
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🌟</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>Дякуємо за відгук!</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Ваша думка важлива для нас</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f5f0e8', marginBottom: 6 }}>
              {title}
            </div>

            {contentTitle && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                «{contentTitle}»
              </div>
            )}

            {authorName && (
              <div style={{ fontSize: 13, color: GOLD, marginBottom: 20, fontWeight: 600 }}>
                Автор: {authorName}
              </div>
            )}
            {!authorName && <div style={{ marginBottom: 20 }} />}

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                    fontSize: 42, lineHeight: 1,
                    color: star <= (hovered || rating) ? GOLD : 'rgba(255,255,255,0.18)',
                    transition: 'color 0.1s, transform 0.1s',
                    transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
                  }}
                >★</button>
              ))}
            </div>

            {rating > 0 && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>
                {['', 'Дуже погано', 'Погано', 'Непогано', 'Добре', 'Чудово!'][rating]}
              </div>
            )}

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Залиш коментар (необов'язково)..."
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                padding: '10px 12px', color: '#f5f0e8', fontSize: 14,
                fontFamily: FONT, resize: 'vertical', boxSizing: 'border-box', marginBottom: 16,
                outline: 'none',
              }}
            />

            {error && (
              <div style={{ fontSize: 13, color: '#f87171', marginBottom: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '8px 12px' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={rating === 0 || loading}
              style={{
                width: '100%',
                background: rating === 0 || loading ? 'rgba(255,184,0,0.35)' : GOLD,
                color: NAVY_DEEP, border: 'none', borderRadius: 10, padding: '13px',
                fontSize: 15, fontWeight: 700,
                cursor: rating === 0 || loading ? 'default' : 'pointer',
                fontFamily: FONT, marginBottom: 10,
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Зберігаємо...' : 'Надіслати відгук'}
            </button>

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: FONT }}
            >
              Пропустити
            </button>
          </>
        )}
      </div>
    </div>
  )
}
