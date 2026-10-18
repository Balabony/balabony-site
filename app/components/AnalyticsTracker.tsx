'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { rememberSessionSource, trackConversion } from '@/lib/conversion'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('bly_sid')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('bly_sid', id)
  }
  return id
}

function getDevice(): string {
  if (typeof window === 'undefined') return 'unknown'
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

async function post(body: object) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch { /* silent — never break the page */ }
}

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const sid = getSessionId()
    rememberSessionSource()

    // Щойно створений акаунт (cookie ставить сервер після входу — lib/conversion-server.ts).
    try {
      if (document.cookie.split('; ').some((c) => c === 'bly_new_reg=1')) {
        document.cookie = 'bly_new_reg=; path=/; max-age=0; samesite=lax; secure'
        trackConversion('reiestratsiia')
      }
    } catch { /* ignore */ }

    post({ type: 'session_start', session_id: sid, device: getDevice() })

    // First-touch attribution: send UTM + referrer once per browser.
    // Server keeps only the earliest touch per balabony_uid.
    try {
      if (!localStorage.getItem('bly_acq_sent')) {
        const p = new URLSearchParams(window.location.search)
        // 18.09.2026: посилання-запрошення (?ref=КОД) — з кабінету автора
        // й з профілю читача — теж є джерелом. Раніше код ішов лише в cookie
        // і рахувався тільки для тих, хто ЗАРЕЄСТРУВАВСЯ; гостей, яких привів
        // автор, не видно було ніде. Тепер перший дотик пише ref як канал,
        // а код — як кампанію. utm, якщо є, має перевагу.
        const ref = (p.get('ref') || '').trim().toUpperCase()
        const viaRef = !p.get('utm_source') && ref !== ''
        post({
          type:         'acquisition',
          utm_source:   viaRef ? 'ref' : p.get('utm_source'),
          utm_medium:   p.get('utm_medium'),
          utm_campaign: viaRef ? ref : p.get('utm_campaign'),
          utm_content:  p.get('utm_content'),
          utm_term:     p.get('utm_term'),
          referrer:     document.referrer || null,
          landing_path: window.location.pathname,
        })
        localStorage.setItem('bly_acq_sent', '1')
      }
    } catch { /* localStorage blocked — server still dedupes by PK */ }

    const handleClose = () => {
      const blob = new Blob(
        [JSON.stringify({ type: 'session_end', session_id: sid })],
        { type: 'application/json' }
      )
      navigator.sendBeacon('/api/analytics/track', blob)
    }
    window.addEventListener('beforeunload', handleClose)

    // Конверсія «завантаження безкоштовного PDF» (календарі, правопис тощо) —
    // один слухач на весь сайт, щоб не правити кожну сторінку з посиланням.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href') || ''
      if (/\.pdf(\?|#|$)/i.test(href) && !href.includes('/api/')) trackConversion('zavantazhennia_pdf', href.split('/').pop() || href)
      // 18.10.2026: перехід до гри з блоку «Відпочиньте між історіями» чи підвалу.
      // Звичайна подія GA4 для звіту, НЕ ключова й не конверсія Ads
      // (гра — не змістовна дія за правилами Ad Grants).
      const src = a.getAttribute('data-games-src')
      if (src) {
        try {
          const w = window as unknown as { gtag?: (...args: unknown[]) => void }
          if (typeof w.gtag === 'function') w.gtag('event', 'perekhid_do_gry', { dzherelo: src, hra: href })
        } catch { /* ignore */ }
      }
    }
    document.addEventListener('click', onClick, true)

    return () => {
      window.removeEventListener('beforeunload', handleClose)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  useEffect(() => {
    post({ type: 'page_view', url: pathname, device: getDevice(), session_id: getSessionId() })
  }, [pathname])

  return null
}
