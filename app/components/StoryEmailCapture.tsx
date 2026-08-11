'use client'

import { useState } from 'react'

const GOLD = '#EF9F27'
const CREAM = '#FFF8EE'
const FONT = "'Montserrat', Arial, sans-serif"

/**
 * Блок збору пошти в кінці історії.
 *
 * Головний канал приходу — газета: читач сканує QR і потрапляє одразу
 * в текст, головної сторінки не бачить. Без цього блока він іде назавжди.
 * Тому форма стоїть під самим текстом, а не в підвалі сайту.
 *
 * Відрізняється від EmailCapture на головній: компактна, у ширину статті,
 * без великої обіцянки — одна конкретна причина лишити пошту (розклад серій).
 * У `source` пишемо slug історії, щоб бачити, які саме тексти дають підписки.
 */
export default function StoryEmailCapture({ slug }: { slug: string }) {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (status === 'loading') return
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus('error')
      setMessage('Перевірте формат пошти')
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: value,
          consent: true,
          website,
          source: `story:${slug}`,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setStatus('ok')
        setMessage('Готово. Найближчого вівторка надішлемо нову серію.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Не вдалося підписатися')
      }
    } catch {
      setStatus('error')
      setMessage("Помилка з'єднання. Спробуйте ще раз.")
    }
  }

  return (
    <section
      aria-labelledby="story-email-title"
      style={{
        marginTop: 36,
        padding: '24px 22px',
        background: 'rgba(239,159,39,0.06)',
        border: `1px solid ${GOLD}33`,
        borderRadius: 16,
        fontFamily: FONT,
      }}
    >
      <h2
        id="story-email-title"
        style={{ fontSize: 18, fontWeight: 800, color: CREAM, margin: '0 0 8px' }}
      >
        Нова серія щовівторка і щоп&apos;ятниці
      </h2>
      <p style={{ fontSize: 14, color: '#b5c7dd', lineHeight: 1.6, margin: '0 0 18px' }}>
        Лишіть пошту — надішлемо наступну серію, щойно вийде. Це безкоштовно,
        відписатися можна одним кліком у будь-якому листі.
      </p>

      {status === 'ok' ? (
        <div
          role="status"
          style={{
            background: 'rgba(74,222,128,0.12)',
            border: '1px solid rgba(74,222,128,0.4)',
            borderRadius: 12,
            padding: '14px 16px',
            color: '#9ae6b4',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="email"
              aria-label="Ваша електронна пошта"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                if (status === 'error') setStatus('idle')
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') submit()
              }}
              placeholder="ваш@email.com"
              style={{
                flex: '1 1 220px',
                minWidth: 0,
                fontSize: 16,
                fontFamily: FONT,
                color: CREAM,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${GOLD}55`,
                borderRadius: 12,
                padding: '13px 16px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={submit}
              disabled={status === 'loading'}
              style={{
                flex: '0 0 auto',
                fontSize: 15,
                fontWeight: 800,
                fontFamily: FONT,
                color: '#1a1205',
                background: status === 'loading' ? '#caa24a' : GOLD,
                border: 'none',
                borderRadius: 12,
                padding: '13px 26px',
                cursor: status === 'loading' ? 'default' : 'pointer',
              }}
            >
              {status === 'loading' ? 'Хвилинку…' : 'Надсилайте'}
            </button>
          </div>

          {/* honeypot — приховане поле для ботів */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            aria-hidden="true"
          />

          <p style={{ fontSize: 11, color: '#7f93ab', lineHeight: 1.5, margin: '10px 0 0' }}>
            Натискаючи «Надсилайте», ви погоджуєтеся отримувати листи про нові серії.
          </p>

          {status === 'error' && (
            <div role="alert" style={{ fontSize: 13, color: '#fca5a5', marginTop: 10 }}>
              {message}
            </div>
          )}
        </>
      )}
    </section>
  )
}
