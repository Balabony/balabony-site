'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    function notifyUpdate() {
      ;(window as any).__swUpdateAvailable = true
      window.dispatchEvent(new CustomEvent('sw-update'))
    }

    let reloading = false
    const onControllerChange = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) notifyUpdate()

      reg.addEventListener('updatefound', () => {
        const nw = reg.installing
        if (!nw) return
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdate()
          }
        })
      })

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    }).catch((err) => console.warn('SW registration failed:', err))

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}
