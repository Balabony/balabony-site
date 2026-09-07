'use client'

import { useEffect, useState } from 'react'

/**
 * Рядок фактів під гаслом: скільки історій, авторів, скільки нового за місяць.
 *
 * Клієнтський, бо app/page.tsx має 'use client' — числа беремо з /api/stats.
 * Поки числа не прийшли або дорівнюють нулю, рядок не рендериться зовсім:
 * порожній або нульовий лічильник гірший за його відсутність.
 */

const FONT = "'Montserrat', sans-serif"
const GOLD = '#C08A2E'
const CREAM = '#FFF8EE'

type Stats = { works: number; authors: number; fresh: number }

function plural(n: number, one: string, few: string, many: string): string {
  const m100 = n % 100
  const m10 = n % 10
  if (m100 >= 11 && m100 <= 14) return many
  if (m10 === 1) return one
  if (m10 >= 2 && m10 <= 4) return few
  return many
}

export default function FactsLine({ initial }: { initial?: Stats } = {}) {
  // Готові числа з сервера — щоб рядок фактів був у HTML одразу.
  const [s, setS] = useState<Stats | null>(initial && initial.works > 0 ? initial : null)

  useEffect(() => {
    if (initial) return
    fetch('/api/stats')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: Stats) => {
        if (d && d.works > 0) setS(d)
      })
      .catch(() => {})
  }, [initial])

  if (!s) return null

  const items = [
    `${s.works} ${plural(s.works, 'історія', 'історії', 'історій')}`,
    `${s.authors} ${plural(s.authors, 'автор', 'автори', 'авторів')}`,
  ]
  if (s.fresh > 0) {
    items.push(`${s.fresh} ${plural(s.fresh, 'нова', 'нові', 'нових')} за місяць`)
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 20px 14px',
        fontFamily: FONT,
        fontSize: 13,
        color: CREAM,
        opacity: 0.75,
        textAlign: 'center',
        lineHeight: 1.5,
      }}
    >
      {items.map((t, i) => (
        <span key={t}>
          {i > 0 && <span style={{ color: GOLD, margin: '0 8px' }}>·</span>}
          {t}
        </span>
      ))}
    </div>
  )
}
