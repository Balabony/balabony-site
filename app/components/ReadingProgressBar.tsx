'use client'

import { useEffect, useState } from 'react'

/**
 * Смужка прогресу читання вгорі сторінки.
 *
 * Навіщо: у довгому тексті читач не бачить, скільки лишилося. Смужка
 * відповідає на це, не займаючи місця й не відволікаючи — три пікселі
 * під шапкою.
 *
 * Міряє саме ТЕКСТ, а не всю сторінку: інакше коментарі, підписка на розсилку
 * й підвал показували б «прочитано 60%» на середині твору.
 *
 * position: fixed — тому не зсуває нічого й не додає CLS.
 */

export default function ReadingProgressBar() {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    let frame = 0

    const compute = () => {
      frame = 0
      const article = document.querySelector('article')
      if (!article) return

      const rect = article.getBoundingClientRect()
      const top = window.scrollY + rect.top
      const height = article.offsetHeight
      if (height <= 0) return

      // Скільки тексту лишилося ПІД нижнім краєм екрана: коли останній
      // рядок торкнувся низу вікна, твір прочитано, а не коли верх статті
      // виїхав за екран.
      const seen = window.scrollY + window.innerHeight - top
      const total = height + 0.0001
      const next = Math.max(0, Math.min(100, (seen / total) * 100))
      setPercent(next)
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

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 70,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #ef9f27, #f4b942)',
          transition: 'width 90ms linear',
        }}
      />
    </div>
  )
}
