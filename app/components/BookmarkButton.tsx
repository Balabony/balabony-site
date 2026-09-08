'use client'

import { useEffect, useState } from 'react'

/**
 * Кнопка «Зберегти» — закладка на твір.
 *
 * Стан питаємо в сервера при відкритті, бо закладки для залогінених спільні
 * на всіх пристроях: збережене з телефона має бути позначене й на комп'ютері.
 *
 * Натискання показує новий стан ОДРАЗУ, не чекаючи відповіді, а якщо запит
 * не пройшов — повертає назад. Читач не має дивитися на крутилку заради
 * такої дрібниці.
 */

export default function BookmarkButton({
  slug,
  title,
  path,
  gold = '#ef9f27',
}: {
  slug: string
  title?: string
  path: string
  gold?: string
}) {
  const [saved, setSaved] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/bookmarks?slug=${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { saved?: boolean } | null) => {
        if (!cancelled) setSaved(Boolean(d?.saved))
      })
      .catch(() => {
        if (!cancelled) setSaved(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  async function toggle() {
    if (busy || saved === null) return
    const next = !saved
    setSaved(next)
    setBusy(true)
    try {
      const r = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, path, saved: next }),
      })
      const d = (await r.json()) as { ok?: boolean }
      if (!d?.ok) setSaved(!next)
    } catch {
      setSaved(!next)
    } finally {
      setBusy(false)
    }
  }

  // Поки стан невідомий, кнопку показуємо в спокійному вигляді —
  // порожнє місце смикало б сторінку.
  const isOn = saved === true

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isOn}
      aria-label={isOn ? 'Прибрати зі збережених' : 'Зберегти, щоб повернутися'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 14px',
        borderRadius: 10,
        border: `1px solid ${gold}${isOn ? 'cc' : '55'}`,
        background: isOn ? `${gold}1f` : 'transparent',
        color: isOn ? gold : 'inherit',
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 14,
        fontWeight: 600,
        cursor: saved === null ? 'default' : 'pointer',
        opacity: saved === null ? 0.6 : 1,
        transition: 'background 140ms ease, border-color 140ms ease',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>
        {isOn ? '★' : '☆'}
      </span>
      {isOn ? 'Збережено' : 'Зберегти'}
    </button>
  )
}
