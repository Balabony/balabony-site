'use client'

import { useState, useEffect } from 'react'

const GOLD = '#EF9F27'
const FONT = "'Montserrat', Arial, sans-serif"

interface StreakData {
  current: number
  longest: number
  freezes: number
}

function dayWord(n: number): string {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'day'
  return 'days'
}

export default function StreakBadge() {
  const [data, setData] = useState<StreakData | null>(null)

  useEffect(() => {
    fetch('/api/streak')
      .then(r => r.json())
      .then((d: StreakData) => setData(d))
      .catch(() => {})
  }, [])

  if (!data) return null

  const active = data.current > 0

  return (
    <div style={{
      maxWidth: 760, margin: '0 auto 28px', display: 'flex', alignItems: 'center', gap: 16,
      background: active ? 'linear-gradient(135deg, rgba(239,159,39,0.16), rgba(239,159,39,0.06))' : 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${active ? GOLD : 'rgba(239,159,39,0.3)'}`,
      borderRadius: 16, padding: '18px 22px',
    }}>
      <div style={{ fontSize: 36, lineHeight: 1, flexShrink: 0, color: GOLD, fontWeight: 900, fontFamily: "'Lora', serif" }}>
        {data.current}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1.1 }}>
          {active ? `${data.current} ${dayWord(data.current)} read streak` : 'Start your streak'}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: FONT, marginTop: 4 }}>
          {active
            ? `Read daily to keep the flame.${data.longest > data.current ? ` Best: ${data.longest}.` : ''}`
            : 'Read an episode today to light it up.'}
        </div>
        {active && data.freezes > 0 && (
          <div style={{ fontSize: 12, color: GOLD, fontFamily: FONT, marginTop: 6, fontWeight: 700 }}>
            Freezes left: {data.freezes}
          </div>
        )}
      </div>
    </div>
  )
}