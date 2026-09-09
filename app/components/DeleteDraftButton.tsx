'use client'

import { useState } from 'react'

/**
 * «Видалити чернетку» — тільки для чернеток і тільки свою.
 *
 * Два кроки навмисно: перше натискання відкриває питання, друге видаляє.
 * Одноклікове видалення поруч із «Опублікувати» рано чи пізно спрацювало б
 * випадково.
 *
 * З 09.09.2026 сам роут /api/author/delete-draft перед видаленням шле копію
 * тексту авторові й у редакцію — тому в питанні більше не лякаємо
 * невідновністю, а кажемо про лист.
 */

const FONT = "'Montserrat', Arial, sans-serif"
const AMBER = '#ef9f27'

export default function DeleteDraftButton({
  contentId,
  title,
}: {
  contentId: string
  title: string
}) {
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/author/delete-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      })
      const d = (await res.json()) as { ok?: boolean; error?: string }
      if (d?.ok) {
        // Перелік творів серверний — після видалення його треба перечитати,
        // інакше картка лишиться на екрані як живий твір.
        window.location.reload()
      } else {
        setError(d?.error ?? 'Не вдалося видалити.')
        setBusy(false)
      }
    } catch {
      setError('Не вдалося видалити. Перевірте зв’язок.')
      setBusy(false)
    }
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        style={{
          marginTop: 10, marginRight: 8,
          fontFamily: FONT, fontSize: '0.85rem', fontWeight: 600,
          color: '#8fa3c4', background: 'transparent',
          border: '1px solid rgba(143,163,196,0.35)',
          borderRadius: 8, padding: '7px 13px', cursor: 'pointer',
        }}
      >
        Видалити чернетку
      </button>
    )
  }

  return (
    <div style={{
      marginTop: 10, padding: '10px 14px', borderRadius: 8,
      border: '1px solid rgba(239,159,39,0.45)', background: 'rgba(239,159,39,0.10)',
      fontFamily: FONT,
    }}>
      <div style={{ fontSize: '0.88rem', color: '#f5f0e8', lineHeight: 1.6, marginBottom: 10 }}>
        Видалити «{title}» назавжди? На сайті твору більше не буде, але копію
        тексту ми одразу надішлемо вам на пошту.
      </div>

      {error && (
        <div style={{ fontSize: '0.85rem', color: AMBER, marginBottom: 10, lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          style={{
            fontFamily: FONT, fontSize: '0.85rem', fontWeight: 700,
            color: '#0a1628', background: AMBER, border: 'none',
            borderRadius: 8, padding: '7px 14px',
            cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Видаляємо…' : 'Так, видалити'}
        </button>
        <button
          type="button"
          onClick={() => { setAsking(false); setError('') }}
          style={{
            fontFamily: FONT, fontSize: '0.85rem', fontWeight: 600, color: '#8fa3c4',
            background: 'transparent', border: '1px solid rgba(143,163,196,0.35)',
            borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
          }}
        >
          Скасувати
        </button>
      </div>
    </div>
  )
}
