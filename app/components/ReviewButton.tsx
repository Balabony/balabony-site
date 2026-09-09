'use client'

import { useEffect, useState } from 'react'
import ReviewModal from './ReviewModal'

/**
 * Кнопка «Залишити відгук» на сторінці твору.
 *
 * Навіщо. Механіка відгуків існувала з самого початку: є `ReviewModal`, є
 * `/api/reviews`, є нарахування 15 балів. Але 09.09.2026 виявилося, що
 * `ReviewModal` НІДЕ не викликається — grep по всьому `app` знаходив лише сам
 * файл. Тобто залишити відгук на сайті було фізично неможливо, і в
 * `point_events` за весь час нуль рядків з kind = 'review'.
 *
 * Це третій випадок того самого за один день: конкурсна форма, яка мовчки
 * різала текст; кнопка «Перелік творів», яка не виглядала як дія; і ось це.
 *
 * Стан беремо легким запитом `?state=1` — скільки відгуків і чи є мій. Повний
 * список сюди тягти не можна: сторінка твору найчастіша на сайті.
 */

const GOLD = '#ef9f27'

interface State {
  ok?: boolean
  total?: number
  mine?: boolean
  avg?: number | null
  points?: number
}

export default function ReviewButton({
  contentId,
  contentType = 'story',
  authorId,
  authorName,
  contentTitle,
}: {
  contentId: string
  contentType?: 'story' | 'series'
  authorId?: string
  authorName?: string
  contentTitle?: string
}) {
  const [s, setS] = useState<State | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/reviews?state=1&contentId=${encodeURIComponent(contentId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: State | null) => {
        if (!cancelled) setS(d)
      })
      .catch(() => {
        if (!cancelled) setS(null)
      })
    return () => {
      cancelled = true
    }
  }, [contentId])

  // Якщо запит стану не пройшов — кнопку не показуємо взагалі. Краще нічого,
  // ніж кнопка, яка при натисканні скаже «не вдалося».
  if (!s?.ok) return null

  const mine = Boolean(s.mine)
  const points = s.points ?? 15

  return (
    <>
      <button
        type="button"
        onClick={() => !mine && setOpen(true)}
        disabled={mine}
        aria-label={mine ? 'Ваш відгук уже враховано' : `Залишити відгук, ${points} балів`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 14px',
          borderRadius: 10,
          border: `1px solid ${GOLD}${mine ? 'cc' : '55'}`,
          background: mine ? `${GOLD}1f` : 'transparent',
          color: mine ? GOLD : 'inherit',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: mine ? 'default' : 'pointer',
          transition: 'background 140ms ease, border-color 140ms ease',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>
          {mine ? '★' : '☆'}
        </span>
        {mine ? 'Ваш відгук враховано' : `Залишити відгук · ${points} балів`}
        {(s.total ?? 0) > 0 && (
          <span style={{ opacity: 0.7, fontWeight: 500 }}>
            · {s.total}
            {s.avg ? ` (${s.avg})` : ''}
          </span>
        )}
      </button>

      {open && (
        <ReviewModal
          contentType={contentType}
          contentId={contentId}
          authorId={authorId}
          authorName={authorName}
          contentTitle={contentTitle}
          onClose={() => setOpen(false)}
          onSaved={() =>
            setS(prev =>
              prev ? { ...prev, mine: true, total: (prev.total ?? 0) + 1 } : prev,
            )
          }
        />
      )}
    </>
  )
}
