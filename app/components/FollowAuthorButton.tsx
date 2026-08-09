'use client'

import { useEffect, useState } from 'react'

/**
 * Кнопка «Стежити» на публічній сторінці автора.
 *
 * На відміну від лайка, тут потрібен акаунт: підписка має сенс лише тоді,
 * коли платформі є кому і куди показати нові твори автора.
 *
 * Незалогінений бачить ту саму кнопку з живим лічильником, а на кліку
 * потрапляє на вхід із поверненням назад. Ховати кнопку від гостя не можна:
 * саме вона й пояснює, навіщо реєструватися.
 */

const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

function pluralFollowers(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return `${n} читачів`
  if (mod10 === 1) return `${n} читач`
  if (mod10 >= 2 && mod10 <= 4) return `${n} читачі`
  return `${n} читачів`
}

interface FollowState {
  ok?: boolean
  count?: number
  followed?: boolean
  authed?: boolean
}

export default function FollowAuthorButton({
  authorUserId,
}: {
  authorUserId?: string | null
}) {
  const [count, setCount] = useState(0)
  const [followed, setFollowed] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!authorUserId) return
    let cancelled = false

    fetch(`/api/author/follow?authorUserId=${encodeURIComponent(authorUserId)}`)
      .then((r) => r.json())
      .then((d: FollowState) => {
        if (cancelled) return
        setCount(Number(d?.count ?? 0))
        setFollowed(Boolean(d?.followed))
        setAuthed(Boolean(d?.authed))
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [authorUserId])

  if (!authorUserId) return null

  async function toggle() {
    if (busy) return

    if (!authed) {
      // Вхід іде через magic link на /auth/callback і параметра повернення
      // поки не приймає. Тому просто ведемо на /login: обіцяти повернення
      // сюди, поки цього немає в авторизації, — брехати кнопкою.
      window.location.href = '/login'
      return
    }

    const next = !followed
    setBusy(true)
    // Показуємо результат одразу: на повільній мережі кнопка інакше
    // виглядає зламаною, і людина тисне вдруге.
    setFollowed(next)
    setCount((c) => Math.max(0, c + (next ? 1 : -1)))

    try {
      const res = await fetch('/api/author/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorUserId, follow: next }),
      })
      const d = (await res.json()) as FollowState
      if (d?.ok) {
        setCount(Number(d.count ?? 0))
        setFollowed(Boolean(d.followed))
      } else {
        // Сервер не прийняв — повертаємо як було, щоб кнопка не брехала.
        setFollowed(!next)
        setCount((c) => Math.max(0, c + (next ? -1 : 1)))
      }
    } catch {
      setFollowed(!next)
      setCount((c) => Math.max(0, c + (next ? -1 : 1)))
    } finally {
      setBusy(false)
    }
  }

  const label = followed ? 'Ви стежите' : 'Стежити за автором'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={followed}
        style={{
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 600,
          padding: '10px 20px',
          borderRadius: 999,
          cursor: busy ? 'default' : 'pointer',
          border: `1.5px solid ${GOLD}`,
          background: followed ? GOLD : 'transparent',
          color: followed ? '#0e1a2b' : GOLD,
          opacity: busy ? 0.7 : 1,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {followed ? '✓ ' : '+ '}
        {label}
      </button>

      {ready && count > 0 && (
        <span style={{ fontFamily: FONT, fontSize: 14, color: '#94a3b8' }}>
          {pluralFollowers(count)}
        </span>
      )}
    </div>
  )
}
