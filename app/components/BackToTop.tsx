'use client'

import { useEffect, useState } from 'react'

/**
 * Кнопка «нагору» в довгому тексті.
 *
 * З'являється, лише коли читач помітно опустився, і зникає біля кінця:
 * унизу сторінки вже стоять свої кнопки (перехід між серіями, поширення),
 * і третій круглий елемент туди не влазить.
 *
 * Позиціонується вище нижньої панелі сайту й лівіше від кнопки «Аа»,
 * щоб не накривати ні те, ні інше.
 */

/** Нижче скількох пікселів має сенс пропонувати повернення. */
const SHOW_AFTER = 1200

export default function BackToTop({ gold = '#ef9f27' }: { gold?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0

    const compute = () => {
      frame = 0
      const y = window.scrollY
      const bottomLeft = document.body.scrollHeight - (y + window.innerHeight)
      setVisible(y > SHOW_AFTER && bottomLeft > 600)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(compute)
    }

    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label="На початок тексту"
      title="На початок"
      onClick={() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
      }}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 128px)',
        zIndex: 65,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: `1px solid ${gold}66`,
        background: 'rgba(10, 22, 40, 0.92)',
        color: gold,
        fontSize: 18,
        lineHeight: 1,
        cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(0,0,0,0.32)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span aria-hidden="true">↑</span>
    </button>
  )
}
