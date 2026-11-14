'use client'

import { useState } from 'react'
import { workPath } from '@/lib/rss'

/**
 * «Не згоден з умовами — зняти всі мої твори з публікації» (14.11.2026).
 *
 * Платформа поки безкоштовна, виплат авторам немає. Автор, якого це не
 * влаштовує, одним запитом просить редакцію зняти всі його опубліковані
 * твори. Як і в RequestUnpublishButton, твори знімає редакція, а не сам автор:
 * так не ламаються посилання, які вже знає Google. Запит іде через наявний
 * /api/author/message — нового серверного коду немає.
 */

const FONT = "'Montserrat', Arial, sans-serif"
const AMBER = '#ef9f27'

type Work = { contentId: string; title: string; slug?: string | null; type?: string | null }

export default function RequestUnpublishAllButton({ works }: { works: Work[] }) {
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (works.length === 0) return null

  async function send() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const list = works
        .map((w, i) =>
          `${i + 1}. «${w.title}»` +
          (w.slug ? ` — ${workPath(w.type ?? null, w.slug)}` : '') +
          ` (ID: ${w.contentId})`,
        )
        .join('\n')
      const res = await fetch('/api/author/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'works',
          body:
            'Я не погоджуюся з умовами безкоштовної платформи. ' +
            'Прошу зняти з публікації всі мої твори:\n' + list,
        }),
      })
      const d = (await res.json()) as { ok?: boolean; error?: string }
      if (d?.ok) setDone(true)
      else setError(d?.error ?? 'Не вдалося надіслати запит.')
    } catch {
      setError('Не вдалося надіслати запит. Перевірте зв’язок.')
    }
    setBusy(false)
  }

  if (done) {
    return (
      <div style={{ marginTop: 12, fontFamily: FONT, fontSize: '0.9rem', color: '#f5f0e8', lineHeight: 1.6 }}>
        Запит надіслано. Редакція зніме ваші твори з публікації й напише вам.
      </div>
    )
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        style={{
          marginTop: 12, fontFamily: FONT, fontSize: '0.88rem', fontWeight: 700,
          color: '#FAC775', background: 'transparent',
          border: '1px solid rgba(250,199,117,0.6)', borderRadius: 8,
          padding: '9px 15px', cursor: 'pointer',
        }}
      >
        Не публікувати мої твори: зняти всі з публікації
      </button>
    )
  }

  return (
    <div style={{ marginTop: 12, fontFamily: FONT }}>
      <div style={{ fontSize: '0.9rem', color: '#f5f0e8', lineHeight: 1.6, marginBottom: 10 }}>
        Надіслати редакції запит зняти з публікації всі ваші твори ({works.length})?
        Їх прибере редакція, і вони перестануть бути доступними читачам.
      </div>
      {error && <div style={{ fontSize: '0.85rem', color: AMBER, marginBottom: 10 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={send}
          disabled={busy}
          style={{
            fontFamily: FONT, fontSize: '0.88rem', fontWeight: 700,
            color: '#0a1628', background: AMBER, border: 'none', borderRadius: 8,
            padding: '9px 15px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Надсилаємо…' : 'Так, надіслати'}
        </button>
        <button
          type="button"
          onClick={() => { setAsking(false); setError('') }}
          style={{
            fontFamily: FONT, fontSize: '0.88rem', fontWeight: 600, color: '#8fa3c4',
            background: 'transparent', border: '1px solid rgba(143,163,196,0.35)',
            borderRadius: 8, padding: '9px 15px', cursor: 'pointer',
          }}
        >
          Скасувати
        </button>
      </div>
    </div>
  )
}
