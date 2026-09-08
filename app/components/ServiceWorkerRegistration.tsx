'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    function notifyUpdate() {
      ;(window as any).__swUpdateAvailable = true
      window.dispatchEvent(new CustomEvent('sw-update'))
    }

    // 08.09.2026. Чи керував сторінкою воркер УЖЕ на момент завантаження.
    //
    // На першому візиті контролера немає: install → activate → clients.claim()
    // у sw.js відбуваються одразу, claim() спричиняє controllerchange, і
    // безумовний reload нижче перезавантажував сторінку посеред завантаження.
    // Наслідок — усе качалося двічі: обкладинки з Supabase, чанки Next,
    // gtag. У PageSpeed це давало подвійну вагу і LCP 7,5 с, бо він завжди
    // приходить із чистим профілем, тобто завжди без контролера.
    //
    // Перезавантажувати треба лише коли воркер СПРАВДІ оновився — тобто
    // старий контролер був і його замінив новий.
    const hadController = !!navigator.serviceWorker.controller

    let reloading = false
    const onControllerChange = () => {
      if (!hadController) return
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
