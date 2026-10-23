'use client'

import { useState } from 'react'

/**
 * Кнопка «Копіювати посилання» для опублікованого твору.
 * Проста зручність: автор копіює лінк одним кліком, щоб кинути друзям
 * чи в соцмережі, не відкриваючи твір окремо.
 */
export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const done = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done, () => {})
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      style={{
        display: 'inline-block',
        marginTop: 10,
        marginRight: 8,
        fontSize: '0.85rem',
        fontWeight: 700,
        color: copied ? '#4ade80' : '#ef9f27',
        background: 'transparent',
        cursor: 'pointer',
        border: `1px solid ${copied ? 'rgba(74,222,128,0.5)' : 'rgba(239,159,39,0.45)'}`,
        borderRadius: 8,
        padding: '7px 13px',
        fontFamily: 'inherit',
      }}
    >
      {copied ? 'Скопійовано ✓' : 'Копіювати посилання'}
    </button>
  )
}
