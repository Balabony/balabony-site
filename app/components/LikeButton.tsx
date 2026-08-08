'use client'

import { useEffect, useState } from 'react'

/**
 * Кнопка «подобається» під історією.
 *
 * Одна кнопка, один клік, без реєстрації. Повторний клік знімає лайк —
 * інакше випадкове натискання не виправити, і людина злиться на сайт.
 *
 * Лічильник показуємо навіть на нулі: автор поширює посилання і має
 * бачити, що механізм працює, а не гадати, чи кнопка жива.
 */

const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"
const VISITOR_KEY = 'bb_visitor'

/** Один випадковий ідентифікатор на браузер. Жодних персональних даних. */
function getVisitorId(): string {
  const make = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    let v = window.localStorage.getItem(VISITOR_KEY)
    if (!v) {
      v = make()
      window.localStorage.setItem(VISITOR_KEY, v)
    }
    return v
  } catch {
    // Приватний режим або заблоковане сховище: лайк спрацює на цю сесію.
    return make()
  }
}

function pluralLikes(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return `${n} вподобань`
  if (mod10 === 1) return `${n} вподобання`
  if (mod10 >= 2 && mod10 <= 4) return `${n} вподобання`
  return `${n} вподобань`
}

export default function LikeButton({ contentId }: { contentId?: string | null }) {
  const [count, setCount] = useState<number>(0)
  const [liked, setLiked] = useState<boolean>(false)
  const [ready, setReady] = useState<boolean>(false)
  const [busy, setBusy] = useState<boolean>(false)
  const [visitorId, setVisitorId] = useState<string>('')

  useEffect(() => {
    if (!contentId) return
    const v = getVisitorId()
    setVisitorId(v)

    let cancelled = false
    const url = `/api/likes?contentId=${encodeURIComponent(contentId)}&visitorId=${encodeURIComponent(v)}`

    fetch(url)
      .then((r) => r.json())
      .then((d: { ok?: boolean; count?: number; liked?: boolean }) => {
        if (cancelled) return
        setCount(Number(d?.count ?? 0))
        setLiked(Boolean(d?.liked))
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [contentId])

  if (!contentId) return null

  const toggle = async () => {
    if (busy) return
    setBusy(true)

    // Оптимістично: кнопка має відповідати миттєво, мережа доганяє.
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)))

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, visitorId }),
      })
      const d = (await res.json()) as { ok?: boolean; count?: number; liked?: boolean }
      if (d?.ok) {
        setCount(Number(d.count ?? 0))
        setLiked(Boolean(d.liked))
      } else {
        // Не вдалось — повертаємо як було, щоб цифра не брехала.
        setLiked(!nextLiked)
        setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
      }
    } catch {
      setLiked(!nextLiked)
      setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={liked}
        aria-label={liked ? 'Прибрати вподобання' : 'Подобається'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 700,
          color: liked ? '#0a1628' : GOLD,
          background: liked ? GOLD : 'rgba(239,159,39,0.12)',
          border: `1px solid ${liked ? GOLD : 'rgba(239,159,39,0.45)'}`,
          borderRadius: 12,
          padding: '10px 20px',
          cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.7 : 1,
          transition: 'background 0.18s ease, color 0.18s ease, transform 0.12s ease',
          minHeight: 44,
        }}
      >
        <span aria-hidden style={{ fontSize: 17, lineHeight: 1 }}>{liked ? '♥' : '♡'}</span>
        <span>{liked ? 'Подобається' : 'Подобається'}</span>
      </button>

      <span
        style={{
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--on-dark-muted, #94a3b8)',
        }}
      >
        {ready ? pluralLikes(count) : '\u00A0'}
      </span>
    </div>
  )
}
