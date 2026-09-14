'use client'

import { useState } from 'react'

/**
 * Правка тексту однієї конкурсної серії.
 *
 * Текст лежить у звичайному textarea, без редактора з кнопками: серії
 * зберігаються як простий текст, і будь-яке форматування тут довелося б
 * вирізати на публікації. Абзаци — порожній рядок, як і в поданому файлі.
 *
 * Пояснення правки не обов'язкове, але кожна правка з поясненням економить
 * лист авторові. Воно лягає в історію разом із текстом.
 */

const CARD  = '#0f1f38'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const GOLD  = '#ef9f27'
const LINE  = 'rgba(255,255,255,.10)'

export default function EpisodeEditor({
  episodeId,
  initialText,
  initialWords,
  revisions,
}: {
  episodeId: string
  initialText: string
  initialWords: number
  /** Скільки правок цієї серії вже збережено. */
  revisions: number
}) {
  const [text, setText]   = useState(initialText)
  const [note, setNote]   = useState('')
  const [words, setWords] = useState(initialWords)
  const [count, setCount] = useState(revisions)
  const [busy, setBusy]   = useState(false)
  const [msg, setMsg]     = useState('')

  const dirty = text !== initialText

  async function save() {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/editor/episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, text, note }),
      })
      const d = await res.json()
      if (!res.ok || !d?.ok) {
        setMsg(d?.error || 'Не вдалося зберегти')
        return
      }
      if (!d.changed) {
        setMsg('Змін немає — нічого не збережено')
        return
      }
      setWords(d.words)
      setCount(d.revisions)
      setNote('')
      setMsg(
        d.liveUpdated
          ? 'Збережено. Серія вже на сайті — читачі бачать нову редакцію.'
          : 'Збережено.',
      )
    } catch {
      setMsg('Мережа не відповіла')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ margin: '.4rem 0 0' }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        spellCheck
        rows={22}
        style={{
          width: '100%', boxSizing: 'border-box',
          whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif',
          fontSize: 15.5, lineHeight: 1.8, color: '#E6EDF7',
          background: CARD, border: `1px solid ${LINE}`,
          borderRadius: 10, padding: '1rem 1.1rem', resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Що саме виправлено (не обов'язково)"
          style={{
            flex: '1 1 260px', minWidth: 0,
            fontSize: 13.5, color: CREAM, fontFamily: 'inherit',
            background: CARD, border: `1px solid ${LINE}`,
            borderRadius: 8, padding: '.55rem .7rem',
          }}
        />
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          style={{
            fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
            color: dirty ? '#14213a' : MUTED,
            background: dirty ? GOLD : 'transparent',
            border: `1px solid ${dirty ? GOLD : LINE}`,
            borderRadius: 8, padding: '.55rem 1.1rem',
            cursor: busy || !dirty ? 'default' : 'pointer',
          }}
        >
          {busy ? 'Зберігаю…' : 'Зберегти правку'}
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: MUTED, marginTop: 7 }}>
        {words} слів
        {count > 0 && ` · правок збережено: ${count}`}
        {msg && <span style={{ color: CREAM }}> · {msg}</span>}
      </div>
    </div>
  )
}
