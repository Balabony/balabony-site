'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Читає збережений у /accessibility масштаб шрифту (balabony_a11y.fontScale, 1..2)
function readScale(): number {
  try {
    const raw = localStorage.getItem('balabony_a11y')
    if (!raw) return 1
    const parsed = JSON.parse(raw)
    const v = Number(parsed?.fontScale)
    if (!isFinite(v)) return 1
    return Math.min(2, Math.max(1, v))
  } catch {
    return 1
  }
}

/**
 * Застосовує обраний у /accessibility масштаб до всього сайту.
 * Сайт на px-стилях, тож масштабуємо глобальним zoom через CSS-змінну --site-zoom
 * (правило body { zoom: var(--site-zoom, 1) } у globals.css).
 * На самій сторінці /accessibility zoom не вмикаємо — там працює власний прев'ю (--a11y-fs),
 * щоб масштаб не подвоювався.
 */
export default function A11yApplier() {
  const pathname = usePathname() || '/'

  useEffect(() => {
    const apply = () => {
      // На сторінці налаштувань zoom керується самою сторінкою (наживо при зміні розміру).
      if (pathname.startsWith('/accessibility')) return
      document.documentElement.style.setProperty('--site-zoom', String(readScale()))
    }
    apply()
    // реагуємо на зміну налаштувань в іншій вкладці
    window.addEventListener('storage', apply)
    return () => window.removeEventListener('storage', apply)
  }, [pathname])

  return null
}
