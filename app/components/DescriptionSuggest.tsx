'use client'

import { useState } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"

type Props = {
  contentId: string
  onPick: (value: string) => void
}

export default function DescriptionSuggest({ contentId, onPick }: Props) {
  const [busy, setBusy] = useState(false)
  const [variants, setVariants] = useState<string[]>([])
  const [err, setErr] = useState('')

  const ask = async () => {
    setBusy(true)
    setErr('')
    setVariants([])
    try {
      const res = await fetch('/api/author/suggest-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contentId }),
      })
      const d = (await res.json()) as { ok: boolean; error?: string; variants?: string[] }
      if (!d.ok) {
        setErr(d.error ?? 'Не вдалося скласти опис')
        return
      }
      setVariants(d.variants ?? [])
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setBusy(false)
    }
  }

  const pick = (v: string) => {
    onPick(v)
    setVariants([])
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={() => void ask()}
        disabled={busy}
        style={{
          background: 'transparent',
          color: GOLD,
          border: `1px solid ${GOLD}`,
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: FONT,
          cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.55 : 1,
        }}
      >
        {busy ? 'Складаю…' : 'Запропонувати опис'}
      </button>

      {err && (
        <div style={{ marginTop: 8, fontSize: 13, color: GOLD, fontWeight: 600 }}>{err}</div>
      )}

      {variants.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 8 }}>
            Оберіть варіант — його можна буде дописати або замінити своїм.
          </div>
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pick(v)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: NAVY_DEEP,
                color: CREAM,
                border: '1px solid rgba(143,163,196,0.22)',
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 8,
                fontSize: 13.5,
                lineHeight: 1.5,
                fontFamily: FONT,
                cursor: 'pointer',
              }}
            >
              {v}
              <span style={{ display: 'block', marginTop: 5, fontSize: 11.5, color: MUTED }}>
                {v.length} символів
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
