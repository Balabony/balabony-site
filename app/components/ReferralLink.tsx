'use client'

import { useState } from 'react'

/**
 * Посилання-запрошення з кнопкою «Скопіювати».
 *
 * Раніше посилання просто виводилося текстом. На телефоні виділити пальцем
 * рядок на 34 символи так, щоб не захопити зайвого, — окрема мука, а саме з
 * телефона люди й діляться.
 *
 * `navigator.clipboard` доступний лише на https і не в кожному браузері,
 * тому є запасний шлях через приховане поле й `execCommand('copy')`: він
 * застарілий, але працює там, де новий API недоступний.
 */
export default function ReferralLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(url)
      ok = true
    } catch {
      try {
        const el = document.createElement('textarea')
        el.value = url
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        ok = document.execCommand('copy')
        document.body.removeChild(el)
      } catch {
        ok = false
      }
    }
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        flex: '1 1 240px',
        padding: '0.6rem 0.8rem',
        background: 'rgba(255,248,238,0.07)',
        color: '#FFF8EE',
        border: '1px solid rgba(255,248,238,0.14)',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        wordBreak: 'break-all',
      }}>
        {url}
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        style={{
          padding: '0.6rem 1rem',
          borderRadius: '6px',
          border: 'none',
          background: copied ? 'rgba(120,200,140,0.85)' : '#ef9f27',
          color: '#0a1628',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? 'Скопійовано' : 'Скопіювати'}
      </button>
    </div>
  )
}
