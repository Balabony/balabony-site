'use client'

import { useState, useEffect } from 'react'

export default function UpdateBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check if update was already detected before React hydrated
    if ((window as any).__swUpdateAvailable) setVisible(true)

    const handler = () => setVisible(true)
    window.addEventListener('sw-update', handler)
    return () => window.removeEventListener('sw-update', handler)
  }, [])

  const handleUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        // controllerchange listener in layout will reload the page
        return
      }
    }
    window.location.reload()
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: 14,
      background: '#081420', border: '1.5px solid #F5A623',
      borderRadius: 14, padding: '12px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(245,166,35,0.15)',
      fontFamily: "'Montserrat', Arial, sans-serif",
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 20 }}>🔄</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#f5f0e8' }}>
        Доступна нова версія
      </span>
      <button
        onClick={handleUpdate}
        style={{
          fontSize: 12, fontWeight: 700,
          background: '#F5A623', color: '#081420',
          border: 'none', borderRadius: 8,
          padding: '7px 16px', cursor: 'pointer',
          fontFamily: "'Montserrat', Arial, sans-serif",
        }}
      >
        Оновити
      </button>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'none', border: 'none', color: '#556688',
          cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0,
        }}
        aria-label="Закрити"
      >
        ×
      </button>
    </div>
  )
}
