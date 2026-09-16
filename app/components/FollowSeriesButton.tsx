'use client'

import { useEffect, useState } from 'react'

/**
 * «Стежити за серіалом» — на сторінці серії.
 *
 * Чому окремо від «Стежити за автором»: обидва серіали пише одна людина, і
 * підписка на автора означала б, що читач сільського гумору «Балабонів»
 * отримуватиме листи про воєнну драму «Тиша» 18+. Тому стежать за серіалом.
 *
 * Незалогінений бачить ту саму кнопку з живим лічильником, а на кліку йде на
 * вхід із поверненням на цю ж серію. Ховати кнопку від гостя не можна: саме
 * вона й пояснює, навіщо реєструватися.
 */

const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

function pluralReaders(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  if (mod100 >= 11 && mod100 <= 14) return `${n} читачів стежать`
  if (mod10 === 1) return `${n} читач стежить`
  if (mod10 >= 2 && mod10 <= 4) return `${n} читачі стежать`
  return `${n} читачів стежать`
}

interface FollowState {
  ok?: boolean
  count?: number
  followed?: boolean
  authed?: boolean
}

export default function FollowSeriesButton({
  series,
  seriesTitle,
  returnTo,
}: {
  series: 'balabony' | 'tysha'
  seriesTitle: string
  /** Куди повернути після входу — адреса поточної серії. */
  returnTo?: string
}) {
  const [count, setCount] = useState(0)
  const [followed, setFollowed] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/series/follow?series=${encodeURIComponent(series)}`)
      .then((r) => r.json())
      .then((d: FollowState) => {
        if (cancelled) return
        setCount(Number(d?.count ?? 0))
        setFollowed(Boolean(d?.followed))
        setAuthed(Boolean(d?.authed))
        setReady(true)
      })
      .catch(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [series])

  async function toggle() {
    if (busy) return

    if (!authed) {
      // Тут, на відміну від кнопки автора, повернення вже працює:
      // /login приймає ?next, а /auth/callback його поважає.
      const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : ''
      window.location.href = `/login${next}`
      return
    }

    const want = !followed
    setBusy(true)
    // Показуємо результат одразу: на повільній мережі кнопка інакше виглядає
    // зламаною, і людина тисне вдруге.
    setFollowed(want)
    setCount((c) => Math.max(0, c + (want ? 1 : -1)))

    try {
      const res = await fetch('/api/series/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series, follow: want }),
      })
      const d = (await res.json()) as FollowState
      if (d?.ok) {
        setCount(Number(d.count ?? 0))
        setFollowed(Boolean(d.followed))
      } else {
        setFollowed(!want)
        setCount((c) => Math.max(0, c + (want ? -1 : 1)))
      }
    } catch {
      setFollowed(!want)
      setCount((c) => Math.max(0, c + (want ? -1 : 1)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '18px 0 4px' }}>
      <button
        type="button"
        onClick={() => void toggle()}
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
        {followed ? '✓ Ви стежите за серіалом' : `+ Стежити за «${seriesTitle}»`}
      </button>

      {ready && (
        <span style={{ fontFamily: FONT, fontSize: 13.5, color: '#94a3b8' }}>
          {followed
            ? 'Повідомимо про нову серію'
            : count > 0
              ? pluralReaders(count)
              : 'Повідомимо, коли вийде нова серія'}
        </span>
      )}
    </div>
  )
}
