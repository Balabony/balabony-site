'use client'

import { useState } from 'react'

export interface ReviewModalProps {
  contentType: 'series' | 'story'
  contentId: string
  authorId?: string
  authorName?: string
  contentTitle?: string
  onClose: () => void
  /** Викликається лише коли відгук СПРАВДІ збережено на сервері. */
  onSaved?: () => void
}

// Підписи оцінок. Порядок = 1..5, індекс у масиві + 1.
const RATING_LABELS = ['Не зайшло', 'Нормально', 'Добре', 'Дуже добре', 'Чудово'] as const

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#FFB800'
const NAVY = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

// getOrCreateUserId і saveToLocalStorage прибрано 09.09.2026.
//
// Перший видавав власний localStorage-ідентифікатор: очистив браузер — і той
// самий читач лишав відгук за той самий твір знову. Тепер користувача визначає
// сервер через resolveReaderId, як усюди на сайті.
//
// Другий записував відгук у localStorage, коли запит не пройшов, і показував
// «Дякуємо за відгук!» — читач був певен, що написав, а відгук нікуди не
// дійшов. За весь час у базі нуль відгуків, і це одна з причин.

export default function ReviewModal({
  contentType, contentId, authorId, authorName, contentTitle, onClose, onSaved,
}: ReviewModalProps) {
  const [rating,  setRating]  = useState(0)
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
    }
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (res.ok && data?.ok) {
        setDone(true)
        onSaved?.()
        setTimeout(onClose, 2000)
      } else {
        setError(data?.error ?? 'Не вдалося зберегти відгук. Спробуйте ще раз.')
      }
    } catch {
      setError('Не вдалося зберегти відгук. Перевірте зв’язок і спробуйте ще раз.')
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
            <div style={{ fontSize: 52, marginBottom: 12, color: '#4ade80' }}>✓</div>
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

            {/* Оцінка словами.
                Зірки прибрано 09.09.2026 на прохання Богдана. Слова кращі не
                лише через асоціації: читачеві не треба здогадуватися, що
                означає третя позначка з п'яти, а екранний читач озвучує
                «Добре» замість «зірка, зірка, зірка». Аудиторія платформи —
                літні люди й читачі з порушеннями зору. */}
            <div style={{
              display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
              gap: 8, marginBottom: 20,
            }}>
              {RATING_LABELS.map((label, i) => {
                const value = i + 1
                const active = rating === value
                return (
                  <button
                    key={label}
                    onClick={() => setRating(value)}
                    aria-pressed={active}
                    style={{
                      background: active ? 'rgba(239,159,39,0.18)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.14)'}`,
                      borderRadius: 999,
                      cursor: 'pointer',
                      padding: '9px 14px',
                      fontSize: 14,
                      fontWeight: active ? 700 : 500,
                      color: active ? GOLD : '#f5f0e8',
                      fontFamily: FONT,
                      transition: 'background 0.12s, border-color 0.12s',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

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
