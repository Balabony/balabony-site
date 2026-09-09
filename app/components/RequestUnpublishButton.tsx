'use client'

import { useState } from 'react'
import { workPath } from '@/lib/rss'

/**
 * «Попросити зняти з публікації» — для опублікованого твору.
 *
 * Автор не може зняти твір сам навмисно: сторінка, яку вже знає Google,
 * перетворилася б на 404, а прочитання, з яких рахується винагорода,
 * лишилися б без тексту. Але й писати листа вручну автор не мусить — раніше
 * саме через це доводилося шукати пошту редакції і формулювати звернення.
 *
 * Кнопка користується наявним /api/author/message: звернення лягає в
 * author_messages, редакція дістає лист із Reply-To автора, автор — коротке
 * підтвердження. Нового серверного коду не потрібно.
 *
 * Два кроки, як у DeleteDraftButton: перше натискання відкриває питання,
 * друге надсилає.
 */

const FONT = "'Montserrat', Arial, sans-serif"
const AMBER = '#ef9f27'

export default function RequestUnpublishButton({
  contentId,
  title,
  slug,
  type,
}: {
  contentId: string
  title: string
  slug?: string | null
  type?: string | null
}) {
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/author/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'works',
          // Ідентифікатори в тілі листа, щоб редакції не довелося шукати твір
          // за назвою: назви бувають однакові в різних авторів.
          body:
            `Прошу зняти з публікації твір «${title}».\n` +
            // Шлях залежить від типу: серії «Балабонів» живуть на /episodes/,
            // «Тиша» — на /tysha/. Жорсткий /stories/ давав у листі 404.
            (slug ? `Адреса: ${workPath(type ?? null, slug)}\n` : '') +
            `ID: ${contentId}`,
        }),
      })
      const d = (await res.json()) as { ok?: boolean; error?: string }
      if (d?.ok) {
        setDone(true)
        setBusy(false)
      } else {
        setError(d?.error ?? 'Не вдалося надіслати запит.')
        setBusy(false)
      }
    } catch {
      setError('Не вдалося надіслати запит. Перевірте зв’язок.')
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div style={{
        marginTop: 10, padding: '10px 14px', borderRadius: 8,
        border: '1px solid rgba(239,159,39,0.45)', background: 'rgba(239,159,39,0.10)',
        fontFamily: FONT, fontSize: '0.88rem', color: '#f5f0e8', lineHeight: 1.6,
      }}>
        Запит надіслано. Редакція зніме твір і напише вам.
      </div>
    )
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
        Попросити зняти з публікації
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
        Надіслати редакції запит зняти «{title}» з публікації? Твір прибере
        редакція — так ми не зламаємо посилання, які вже ведуть на цю сторінку.
      </div>

      {error && (
        <div style={{ fontSize: '0.85rem', color: AMBER, marginBottom: 10, lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={send}
          disabled={busy}
          style={{
            fontFamily: FONT, fontSize: '0.85rem', fontWeight: 700,
            color: '#0a1628', background: AMBER, border: 'none',
            borderRadius: 8, padding: '7px 14px',
            cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Надсилаємо…' : 'Так, надіслати'}
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
