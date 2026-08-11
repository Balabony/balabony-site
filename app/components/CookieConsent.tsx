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

    // 11.08.2026: банер більше не з'являється миттєво. Читач приходить із
    // газети по QR прямо в текст історії, і перше, що він бачив, — вікно про
    // cookies на пів екрана. Для аудиторії 55+ це причина закрити браузер.
    // Тепер даємо 8 секунд почати читати; згода запитується так само, просто
    // не перекриває перший екран.
    let timer: ReturnType<typeof setTimeout> | undefined

    if (stored === 'granted') applyConsent('granted')
    else if (stored !== 'denied') {
      timer = setTimeout(() => setVisible(true), 8000)
    }

    const reopen = () => setVisible(true)
    window.addEventListener('balabony:cookie-settings', reopen)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('balabony:cookie-settings', reopen)
    }
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
      <p style={{ margin: '0 0 10px', fontSize: 15, lineHeight: 1.55 }}>
        Дозволяєте порахувати, які історії читають? Це допомагає нам їх
        добирати. Читати можна й без дозволу.
      </p>
      <p style={{ margin: '0 0 12px', fontSize: 12, lineHeight: 1.5, color: '#8899bb' }}>
        Докладніше — у{' '}
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
