'use client'

import { useEffect, useState } from 'react'

/**
 * Кнопка «Хочу почути» — голос за озвучення саме цього твору.
 *
 * Навіщо. Механіка голосування вже працює (`/cherga`), але потрапити до неї
 * можна було лише через список авторів на окремій сторінці. Тобто читач, який
 * щойно дочитав твір і саме зараз хотів би почути його голосом, кнопки не
 * бачив узагалі — а бали в кабінеті росли й витрачати їх було нікуди.
 *
 * Стан беремо легким запитом `?content=` (три числа), а не спільним GET, який
 * тягне двадцять рядків черги і список усіх авторів: сторінка твору
 * відкривається найчастіше на сайті.
 *
 * Кнопка НЕ показується взагалі, якщо твір не бере участі в голосуванні —
 * автор відкликав згоду, твір уже озвучено, запит упав. Краще нічого, ніж
 * кнопка, яка при натисканні скаже «не можна».
 */

const GOLD = '#ef9f27'

interface State {
  ok?: boolean
  authorized?: boolean
  eligible?: boolean
  votes?: number
  voted?: boolean
  balance?: number
  cost?: number
}

export default function VoiceVoteButton({ contentId }: { contentId: string }) {
  const [s, setS] = useState<State | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/voice-vote?content=${encodeURIComponent(contentId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: State | null) => {
        if (!cancelled) setS(d)
      })
      .catch(() => {
        if (!cancelled) setS(null)
      })
    return () => {
      cancelled = true
    }
  }, [contentId])

  if (!s?.ok || !s.eligible) return null

  const cost = s.cost ?? 50
  const voted = Boolean(s.voted)

  async function vote() {
    if (busy || voted) return

    if (!s?.authorized) {
      setMsg('Щоб голосувати, увійдіть у кабінет.')
      return
    }
    if ((s.balance ?? 0) < cost) {
      setMsg(`Потрібно ${cost} балів, у вас ${s.balance ?? 0}. Бали дає читання і запрошення друзів.`)
      return
    }

    setBusy(true)
    setMsg('')
    try {
      const r = await fetch('/api/voice-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId }),
      })
      const d = (await r.json()) as { ok?: boolean; votes?: number; balance?: number; error?: string }
      if (d?.ok) {
        setS(prev => (prev ? { ...prev, voted: true, votes: d.votes ?? (prev.votes ?? 0) + 1, balance: d.balance } : prev))
      } else {
        setMsg(d?.error ?? 'Не вдалося зарахувати голос. Спробуйте ще раз.')
      }
    } catch {
      setMsg('Не вдалося зарахувати голос. Спробуйте ще раз.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 6 }}>
      <button
        type="button"
        onClick={vote}
        disabled={voted || busy}
        aria-label={voted ? 'Ваш голос за озвучення враховано' : `Віддати голос за озвучення, ${cost} балів`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 14px',
          borderRadius: 10,
          border: `1px solid ${GOLD}${voted ? 'cc' : '55'}`,
          background: voted ? `${GOLD}1f` : 'transparent',
          color: voted ? GOLD : 'inherit',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: voted || busy ? 'default' : 'pointer',
          opacity: busy ? 0.6 : 1,
          transition: 'background 140ms ease, border-color 140ms ease',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>
          🎧
        </span>
        {voted ? 'Ваш голос враховано' : `Хочу почути · ${cost} балів`}
        {(s.votes ?? 0) > 0 && (
          <span style={{ opacity: 0.7, fontWeight: 500 }}>· {s.votes}</span>
        )}
      </button>

      {msg && (
        <span
          role="status"
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: '#c8d4e8',
            fontFamily: "'Montserrat', sans-serif",
            maxWidth: 320,
          }}
        >
          {msg}
        </span>
      )}
    </span>
  )
}
