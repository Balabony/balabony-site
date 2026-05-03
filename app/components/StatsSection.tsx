'use client'

import { useTheme } from '../context/ThemeContext'

const GOLD = '#F5A623'
const FONT = "'Montserrat', Arial, sans-serif"

const STATS = [
  { value: '47',   label: 'серій вийшло' },
  { value: '3',    label: 'сезони' },
  { value: 'AI',   label: 'синтез голосу' },
  { value: '120+', label: 'годин прослухано' },
]

export default function StatsSection() {
  const { colors } = useTheme()

  return (
    <section style={{ background: colors.bg, borderBottom: `3px solid ${GOLD}`, padding: '28px 20px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '10px 4px' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: GOLD, fontFamily: FONT, lineHeight: 1.1, marginBottom: 5 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: colors.fg, fontFamily: FONT, opacity: 0.8, letterSpacing: 0.3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
