'use client'

import { useState } from 'react'

/**
 * Вихід із кабінету редактора.
 *
 * ЧОМУ POST, А НЕ ПОСИЛАННЯ. Вихід гасить сесію в базі, а не лише стирає
 * cookie: якщо редакторка заходила з чужого комп'ютера, після виходу та
 * cookie не працює й там. GET-посиланням цього робити не можна — його
 * може смикнути передзавантажувач браузера і викинути людину з кабінету.
 */

export default function LogoutButton({ color }: { color: string }) {
  const [busy, setBusy] = useState(false)

  async function out() {
    if (busy) return
    setBusy(true)
    try {
      await fetch('/api/editor/session', { method: 'POST' })
    } catch {
      /* однаково відправляємо на вхід — cookie вже могла злетіти */
    }
    window.location.href = '/editor/login'
  }

  return (
    <button
      onClick={out}
      disabled={busy}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        font: 'inherit',
        fontSize: 12.5,
        color,
        textDecoration: 'underline',
        cursor: busy ? 'default' : 'pointer',
        opacity: busy ? 0.5 : 1,
      }}
    >
      {busy ? 'виходимо…' : 'вийти'}
    </button>
  )
}
