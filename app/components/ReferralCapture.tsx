'use client'

import { useEffect } from 'react'

/**
 * Ловить ?ref= в адресі й передає код на сервер, який кладе його в cookie.
 *
 * Чому не middleware: middleware виконується на кожен запит до сайту, і
 * помилка в ньому кладе весь сайт разом із входом. Заради параметра, який
 * зустрічається в частки відсотка переходів, такий ризик не виправданий.
 *
 * Нічого не малює. Код із адреси прибираємо через replaceState, щоб людина
 * не поширила далі посилання з чужим кодом і щоб він не потрапив у пошукову
 * видачу як окрема адреса.
 */
export default function ReferralCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('ref')
      if (!code) return

      void fetch('/api/referral/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      }).catch(() => {})

      params.delete('ref')
      const rest = params.toString()
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash,
      )
    } catch {
      // нічого не робимо: реферал не має ламати сторінку
    }
  }, [])

  return null
}
