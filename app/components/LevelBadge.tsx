'use client'

import { useState, useEffect } from 'react'
import { levelFromReads } from '@/lib/levels'

const GOLD = '#EF9F27'
const FONT = "'Montserrat', Arial, sans-serif"

function seriesWord(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'серію'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'серії'
  return 'серій'
}

export default function LevelBadge() {
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/reads')
      .then(r => r.json())
      .then((d: { total: number }) => setTotal(d.total ?? 0))
      .catch(() => {})
  }, [])

  if (total === null) return null

  const { current, next } = levelFromReads(total)
  const toNext = next ? next.min - total : 0

  return (
    <div style={{
      maxWidth: 760, margin: '0 auto 28px', display: 'flex', alignItems: 'center', gap: 16,
      background: 'linear-gradient(135deg, rgba(239,159,39,0.16), rgba(239,159,39,0.06))',
      border: `1.5px solid ${GOLD}`,
      borderRadius: 16, padding: '18px 22px',
    }}>
      <div style={{
        fontSize: 34, lineHeight: 1, flexShrink: 0, color: GOLD, fontWeight: 900,
        fontFamily: "'Lora', serif",
        width: 54, height: 54, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${GOLD}`,
      }}>
        {total}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1.1 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: FONT, marginTop: 4 }}>
          {total === 0
            ? 'Прочитай першу серію, щоб стати Читачем.'
            : `Прочитано ${total} ${seriesWord(total)}.`}
          {next && total > 0 && (
            <> До рівня «{next.title}» — ще {toNext} {seriesWord(toNext)}.</>
          )}
          {!next && total > 0 && <> Найвищий рівень. Браво!</>}
        </div>
      </div>
    </div>
  )
}
