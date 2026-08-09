'use client'

import { useState } from 'react'

/**
 * Кнопка «Опублікувати» під твором у кабінеті автора.
 *
 * Показується лише для чернеток. Прапорець згоди обов'язковий і не
 * поставлений заздалегідь: згода, яку людина не натиснула свідомо, не
 * варта нічого ні юридично, ні по-людськи.
 *
 * Формулювання прапорця свідомо конкретне — що саме публікується і де.
 * «Погоджуюсь з умовами» тут не годиться: автор має розуміти, що його
 * текст стане доступним усім на сайті.
 */

const AMBER = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

export default function PublishWorkButton({
  contentId,
  title,
}: {
  contentId: string
  title?: string
}) {
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (done) {
    return (
      <div style={{ marginTop: 10, fontFamily: FONT, fontSize: '0.85rem', color: '#4ade80' }}>
        ✓ Опубліковано. Оновіть сторінку, щоб побачити оновлений статус.
      </div>
    )
  }

  async function publish() {
    if (!consent || busy) return
    setBusy(true)
    setError(null)

    try {
      const res = await fetch('/api/author/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, consent: true }),
      })
      const d = (await res.json()) as { ok?: boolean; error?: string }
      if (d?.ok) {
        setDone(true)
      } else {
        setError(d?.error ?? 'Не вдалося опублікувати')
      }
    } catch {
      setError('Немає зв’язку. Спробуйте ще раз.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: '12px 14px',
        borderRadius: 10,
        border: '1px solid rgba(239,159,39,0.4)',
        background: 'rgba(239,159,39,0.07)',
      }}
    >
      <label
        style={{
          display: 'flex',
          gap: 9,
          alignItems: 'flex-start',
          fontFamily: FONT,
          fontSize: '0.85rem',
          color: '#e8eef7',
          lineHeight: 1.5,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ marginTop: 3, flexShrink: 0 }}
        />
        <span>
          Я — автор цього твору{title ? ` «${title}»` : ''} і даю згоду опублікувати
          його на Балабонах для всіх читачів.
        </span>
      </label>

      <button
        type="button"
        onClick={publish}
        disabled={!consent || busy}
        style={{
          marginTop: 10,
          fontFamily: FONT,
          fontSize: '0.85rem',
          fontWeight: 700,
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: consent ? AMBER : 'rgba(239,159,39,0.25)',
          color: consent ? '#1c1917' : 'rgba(255,255,255,0.5)',
          cursor: consent && !busy ? 'pointer' : 'default',
        }}
      >
        {busy ? 'Публікуємо…' : 'Опублікувати'}
      </button>

      {error && (
        <div style={{ marginTop: 8, fontFamily: FONT, fontSize: '0.8rem', color: '#fca5a5' }}>
          {error}
        </div>
      )}
    </div>
  )
}
