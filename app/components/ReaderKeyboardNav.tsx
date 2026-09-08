'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Стрілки ← → перегортають серії, як сторінки книжки.
 *
 * Серіал на сто епізодів читають підряд, і тягтися мишею до посилання
 * внизу після кожної серії — зайвий крок. На читалках це звична річ.
 *
 * Чого НЕ перехоплюємо:
 *   — коли фокус у полі вводу чи в редагованому блоці (пошта, коментар);
 *   — коли натиснуто Ctrl/Alt/Cmd чи Shift — це системні поєднання
 *     на кшталт «назад в історії»;
 *   — коли відкритий діалог (панель налаштувань має власний Esc).
 */

export default function ReaderKeyboardNav({
  prevUrl,
  nextUrl,
}: {
  prevUrl?: string
  nextUrl?: string
}) {
  const router = useRouter()

  useEffect(() => {
    if (!prevUrl && !nextUrl) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return

      const el = document.activeElement as HTMLElement | null
      if (el) {
        const tag = el.tagName
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          el.isContentEditable ||
          el.closest('[role="dialog"]')
        ) {
          return
        }
      }

      const target = e.key === 'ArrowLeft' ? prevUrl : nextUrl
      if (!target) return

      e.preventDefault()
      router.push(target)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prevUrl, nextUrl, router])

  return null
}
