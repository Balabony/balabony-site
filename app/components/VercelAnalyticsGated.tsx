'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'

// Vercel Web Analytics — ЛИШЕ ЗА ЗГОДОЮ (s1945, 22.09.2026).
// Сторінка /legal/cookies відносить «Vercel Analytics» до аналітики за згодою, тож
// підключаємо його тільки після «Погодитися» в банері (balabony_cookie_consent = 'granted').
// CookieConsent після вибору кидає подію 'balabony:consent-changed' — тоді вмикаємо без перезавантаження.
const KEY = 'balabony_cookie_consent'

export default function VercelAnalyticsGated() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const read = () => {
      try { setOn(localStorage.getItem(KEY) === 'granted') } catch { setOn(false) }
    }
    read()
    window.addEventListener('balabony:consent-changed', read)
    return () => window.removeEventListener('balabony:consent-changed', read)
  }, [])
  return on ? <Analytics /> : null
}
