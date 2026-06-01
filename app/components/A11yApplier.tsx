'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Читає налаштування доступності, збережені на /accessibility (balabony_a11y)
function readPrefs(): { scale: number; theme: string } {
  try {
    const raw = localStorage.getItem('balabony_a11y')
    if (!raw) return { scale: 1, theme: 'default' }
    const p = JSON.parse(raw)
    const v = Number(p?.fontScale)
    const scale = isFinite(v) ? Math.min(2, Math.max(1, v)) : 1
    const theme = typeof p?.theme === 'string' ? p.theme : 'default'
    return { scale, theme }
  } catch {
    return { scale: 1, theme: 'default' }
  }
}

/**
 * Застосовує налаштування доступності до всього сайту:
 *  - масштаб шрифту через --site-zoom (body { zoom } у globals.css);
 *  - тему доступності через data-a11y-theme на <html>
 *    (правила для dyslexic / high-contrast у globals.css).
 * На самій /accessibility масштабом керує сама сторінка (наживо), тож тут його не чіпаємо.
 */
export default function A11yApplier() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    const apply = () => {
      const onA11yPage = pathname.startsWith('/accessibility')
      const { scale, theme } = readPrefs()

      if (!onA11yPage) {
        document.documentElement.style.setProperty('--site-zoom', String(scale))
      }
      document.documentElement.setAttribute('data-a11y-theme', theme)
    }
    apply()
    window.addEventListener('storage', apply)
    return () => window.removeEventListener('storage', apply)
  }, [pathname])

  return null
}
