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
