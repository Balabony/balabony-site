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

  // 18.09.2026: банер став низькою смужкою біля нижнього краю. Раніше це була
  // картка висотою ~135 px, піднята на 88 px, і на ноутбуці вона сідала
  // посередині головної — просто на блок із кнопкою «Читати».
  // Відступ знизу: на телефоні — над нижньою панеллю (--bb-offset задає
  // BottomBar), на комп'ютері, де панелі немає, — 12 px.
  const btn: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 9,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      role="dialog"
      aria-label="Налаштування файлів cookie"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 'calc(var(--bb-offset, 0px) + 12px)',
        zIndex: 9999,
        maxWidth: 760,
        margin: '0 auto',
        background: NAVY,
        border: `1px solid ${GOLD}`,
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: '#f5f0e8',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px 14px',
      }}
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, flex: '1 1 220px' }}>
        Порахувати, які історії читають?{' '}
        <a href="/legal/cookies" style={{ color: GOLD, fontWeight: 600, fontSize: 12.5 }}>
          Політика Cookies
        </a>
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => decide('granted')}
          style={{ ...btn, background: GOLD, color: '#0a1628', border: 'none', fontWeight: 700 }}
        >
          Прийняти аналітику
        </button>
        <button
          type="button"
          onClick={() => decide('denied')}
          style={{ ...btn, background: 'transparent', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.35)', fontWeight: 600 }}
        >
          Тільки необхідні
        </button>
      </div>
    </div>
  )
}
