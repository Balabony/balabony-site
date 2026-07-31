'use client'

// Банер згоди на аналітичні cookies.
// Працює разом із Google Consent Mode: у GoogleAnalytics.tsx усі згоди за
// замовчуванням = denied, тут вони переводяться в granted, якщо користувач погодився.
// Вибір зберігається у localStorage під ключем balabony_cookie_consent ('granted' | 'denied').
// Щоб відкрити банер повторно, будь-який компонент може викликати:
//   window.dispatchEvent(new Event('balabony:cookie-settings'))

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const KEY = 'balabony_cookie_consent'
const GOLD = '#ef9f27'
const NAVY = '#0f1e3a'

// Службові розділи: банер там не потрібен і заважає — на сторінці входу
// в адмінку він перекривав поле пароля. Аналітику читачів ці розділи
// не стосуються, а вибір усе одно збережеться при першому візиті на сайт.
const SILENT_PREFIXES = ['/admin', '/editor', '/author']

type Choice = 'granted' | 'denied'

function applyConsent(choice: Choice) {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void }
  if (typeof w.gtag !== 'function') return
  const value = choice === 'granted' ? 'granted' : 'denied'
  w.gtag('consent', 'update', {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  })
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname() ?? ''
  const silent = SILENT_PREFIXES.some((p) => pathname.startsWith(p))

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem(KEY)
    } catch {
      // приватний режим або заблоковане сховище — просто показуємо банер
    }

    if (stored === 'granted') applyConsent('granted')
    else if (stored !== 'denied') setVisible(true)

    const reopen = () => setVisible(true)
    window.addEventListener('balabony:cookie-settings', reopen)
    return () => window.removeEventListener('balabony:cookie-settings', reopen)
  }, [])

  function decide(choice: Choice) {
    try {
      localStorage.setItem(KEY, choice)
    } catch {
      // якщо сховище недоступне — вибір діє лише на цю сесію
    }
    applyConsent(choice)
    setVisible(false)
  }

  if (!visible || silent) return null

  return (
    <div
      role="dialog"
      aria-label="Налаштування файлів cookie"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
        zIndex: 9999,
        maxWidth: 720,
        margin: '0 auto',
        background: NAVY,
        border: `1px solid ${GOLD}`,
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: '0 18px 44px rgba(0,0,0,0.45)',
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: '#f5f0e8',
      }}
    >
      <p style={{ margin: '0 0 10px', fontSize: 15, lineHeight: 1.6 }}>
        Ми використовуємо аналітику, щоб бачити, які історії читають і що на сайті працює погано.
        Без вашої згоди аналітичні й рекламні дані не збираються — сайт працює й без неї.
      </p>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: '#8899bb' }}>
        Що саме зберігається — у{' '}
        <a href="/legal/cookies" style={{ color: GOLD, fontWeight: 600 }}>
          Політиці Cookies
        </a>
        . Змінити вибір можна будь-коли.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button
          type="button"
          onClick={() => decide('granted')}
          style={{
            padding: '10px 20px',
            background: GOLD,
            color: '#0a1628',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Прийняти аналітику
        </button>
        <button
          type="button"
          onClick={() => decide('denied')}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            color: '#f5f0e8',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Тільки необхідні
        </button>
      </div>
    </div>
  )
}
