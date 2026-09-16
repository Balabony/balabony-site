'use client'

import { useState } from 'react'

/**
 * Кнопка «Копіювати» біля тексту шорту.
 *
 * Навіщо окремий клієнтський компонент: сама сторінка серверна (їй потрібен
 * прямий запит у базу), а буфер обміну живе тільки в браузері.
 */
export default function CopyText({
  text,
  label = 'Копіювати',
  gold = '#ef9f27',
}: {
  text: string
  label?: string
  gold?: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      style={{
        padding: '7px 12px',
        borderRadius: 8,
        border: `1px solid ${copied ? gold : 'rgba(255,255,255,0.18)'}`,
        background: copied ? `${gold}1f` : 'transparent',
        color: copied ? gold : '#d8d2c6',
        fontFamily: "'Montserrat', Arial, sans-serif",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ Скопійовано' : label}
    </button>
  )
}
