'use client'

import { useEffect, useState } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#8fa3c4'
const FONT = "'Montserrat', Arial, sans-serif"

type Item = {
  id: string
  title: string
  slug: string | null
  type: string | null
  publish_at: string | null
  description: string | null
  recap: string | null
  next_teaser: string | null
  social_post: string | null
}

const FIELDS: { key: keyof Item; label: string }[] = [
  { key: 'description', label: 'Опис серії' },
  { key: 'recap', label: 'Що було раніше' },
  { key: 'next_teaser', label: 'Анонс наступної' },
  { key: 'social_post', label: 'Пост для соцмереж' },
]

function whenLabel(iso: string | null): string {
  if (!iso) return 'дата не призначена'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'дата не призначена'
  return d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ReviewQueuePage() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = () => {
    fetch('/api/admin/episode-review')
      .then(r => r.json())
      .then((d: { ok: boolean; error?: string; items?: Item[] }) => {
        if (!d.ok) { setErr(d.error ?? 'Не вдалося завантажити'); setItems([]); return }
        setItems(d.items ?? [])
      })
      .catch(() => { setErr('Не вдалося завантажити'); setItems([]) })
  }

  useEffect(load, [])

  const act = async (id: string, action: 'publish' | 'return') => {
    setBusy(id)
    try {
      const res = await fetch('/api/admin/episode-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const d = (await res.json()) as { ok: boolean; error?: string }
      if (!d.ok) { setErr(d.error ?? 'Не вдалося'); return }
      setItems(p => (p ? p.filter(i => i.id !== id) : p))
      setErr('')
    } catch {
      setErr('Немає зв’язку')
    } finally {
      setBusy(null)
    }
  }

  const btn: React.CSSProperties = {
    fontSize: 14, borderRadius: 9, padding: '10px 18px', cursor: 'pointer', fontFamily: FONT, border: 'none',
  }

  return (
    <main style={{ background: NAVY_DEEP, padding: '36px 20px 72px', fontFamily: FONT }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: CREAM, margin: '0 0 6px' }}>На редактурі</h1>
        <p style={{ fontSize: 15, color: MUTED, margin: '0 0 24px', lineHeight: 1.6 }}>
          Серії, які автори надіслали. Поки серія тут, автор її не редагує.
        </p>

        {err && <p style={{ color: '#F09595', fontSize: 15 }}>{err}</p>}
        {items === null && <p style={{ color: MUTED, fontSize: 15 }}>Завантажуємо…</p>}
        {items !== null && items.length === 0 && !err && (
          <p style={{ color: MUTED, fontSize: 15 }}>Черга порожня.</p>
        )}

        {(items ?? []).map(it => (
          <div key={it.id} style={{ background: NAVY, border: '1px solid rgba(143,163,196,0.22)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <div style={{ fontSize: 17, color: CREAM }}>{it.title}</div>
              <div style={{ fontSize: 13, color: MUTED }}>{whenLabel(it.publish_at)}</div>
            </div>

            {FIELDS.map(f => (
              <div key={String(f.key)} style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>{f.label}</div>
                <div style={{ fontSize: 14, color: it[f.key] ? '#dbe4f0' : '#6d7f9c', lineHeight: 1.6, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                  {(it[f.key] as string | null) || '— не заповнено'}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={busy === it.id}
                onClick={() => { void act(it.id, 'publish') }}
                style={{ ...btn, background: GOLD, color: NAVY_DEEP, opacity: busy === it.id ? 0.6 : 1 }}
              >
                Опублікувати
              </button>
              <button
                type="button"
                disabled={busy === it.id}
                onClick={() => { void act(it.id, 'return') }}
                style={{ ...btn, background: 'transparent', color: CREAM, border: '1px solid rgba(143,163,196,0.35)', opacity: busy === it.id ? 0.6 : 1 }}
              >
                Повернути автору
              </button>
              {it.slug && (
                <a
                  href={`/stories/${it.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...btn, background: 'transparent', color: MUTED, border: '1px solid rgba(143,163,196,0.25)', textDecoration: 'none', display: 'inline-block' }}
                >
                  Читати текст
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
