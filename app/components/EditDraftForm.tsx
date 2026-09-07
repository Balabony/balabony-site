'use client'

import { useState } from 'react'

/**
 * Редагування чернетки самим автором у кабінеті.
 *
 * Текст не тягнемо разом зі списком творів: у автора їх можуть бути десятки,
 * і сторінка кабінету важчала б на кожен твір, який ніхто не відкриє.
 * Тому текст вантажиться на кліку «Редагувати», окремим запитом.
 *
 * Кнопка показується тільки для чернеток. Опублікований твір автор не
 * переписує — зміна заголовка тягне зміну slug, а це вже перенаправлення.
 */

const AMBER = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

const btn: React.CSSProperties = {
  marginTop: 10,
  fontFamily: FONT,
  fontSize: '0.85rem',
  fontWeight: 700,
  color: AMBER,
  background: 'transparent',
  border: '1px solid rgba(239,159,39,0.45)',
  borderRadius: 8,
  padding: '7px 13px',
  cursor: 'pointer',
}

const field: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: FONT,
  fontSize: '0.9rem',
  color: '#1c1917',
  background: '#f6f1e7',
  border: '1px solid rgba(143,163,196,0.45)',
  borderRadius: 8,
  padding: '8px 10px',
  marginTop: 6,
}

export default function EditDraftForm({ contentId }: { contentId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/author/edit-draft?contentId=${encodeURIComponent(contentId)}`)
      const d = (await res.json()) as { ok?: boolean; title?: string; text?: string; error?: string }
      if (d?.ok) {
        setTitle(d.title ?? '')
        setText(d.text ?? '')
        setOpen(true)
      } else {
        setError(d?.error ?? 'Не вдалося відкрити твір')
      }
    } catch {
      setError('Немає зв’язку. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    if (busy) return
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/author/edit-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, title, text }),
      })
      const d = (await res.json()) as { ok?: boolean; error?: string }
      if (d?.ok) {
        setSaved(true)
      } else {
        setError(d?.error ?? 'Не вдалося зберегти')
      }
    } catch {
      setError('Немає зв’язку. Спробуйте ще раз.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <div>
        <button type="button" onClick={load} disabled={loading} style={btn}>
          {loading ? 'Відкриваю…' : 'Редагувати'}
        </button>
        {error && (
          <div style={{ marginTop: 8, fontFamily: FONT, fontSize: '0.85rem', color: '#fca5a5' }}>
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 12, fontFamily: FONT }}>
      <label style={{ fontSize: '0.8rem', color: '#b9c6db', fontWeight: 700 }}>
        Заголовок
        <input
          value={title}
          maxLength={200}
          onChange={(e) => { setTitle(e.target.value); setSaved(false) }}
          style={field}
        />
      </label>

      <label style={{ display: 'block', marginTop: 12, fontSize: '0.8rem', color: '#b9c6db', fontWeight: 700 }}>
        Текст
        <textarea
          value={text}
          rows={14}
          onChange={(e) => { setText(e.target.value); setSaved(false) }}
          style={{ ...field, lineHeight: 1.55, resize: 'vertical' }}
        />
      </label>

      <div style={{ fontSize: '0.78rem', color: '#8fa3c4', marginTop: 6 }}>
        {text.length} знаків
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          style={{ ...btn, marginTop: 0, background: AMBER, color: '#16202e', borderColor: AMBER }}
        >
          {busy ? 'Зберігаю…' : 'Зберегти'}
        </button>
        <button type="button" onClick={() => setOpen(false)} style={{ ...btn, marginTop: 0 }}>
          Закрити
        </button>
        {saved && <span style={{ fontSize: '0.85rem', color: '#4ade80' }}>✓ Збережено</span>}
        {error && <span style={{ fontSize: '0.85rem', color: '#fca5a5' }}>{error}</span>}
      </div>
    </div>
  )
}
