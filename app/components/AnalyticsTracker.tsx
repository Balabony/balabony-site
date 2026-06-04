'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

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

    post({ type: 'session_start', session_id: sid, device: getDevice() })

    // First-touch attribution: send UTM + referrer once per browser.
    // Server keeps only the earliest touch per balabony_uid.
    try {
      if (!localStorage.getItem('bly_acq_sent')) {
        const p = new URLSearchParams(window.location.search)
        post({
          type:         'acquisition',
          utm_source:   p.get('utm_source'),
          utm_medium:   p.get('utm_medium'),
          utm_campaign: p.get('utm_campaign'),
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
    return () => window.removeEventListener('beforeunload', handleClose)
  }, [])

  useEffect(() => {
    post({ type: 'page_view', url: pathname, device: getDevice(), session_id: getSessionId() })
  }, [pathname])

  return null
}
