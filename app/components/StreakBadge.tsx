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
  if (m10 === 1 && m100 !== 11) return 'день'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дні'
  return 'днів'
}

export default function StreakBadge() {
  const [data, setData] = useState<StreakData | null>(null)

  useEffect(() => {
    fetch('/api/streak')
      // Статус перевіряємо обов'язково: без цього помилка сервера
      // розбиралася як звичайна відповідь і бейдж показував нулі.
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('streak'))))
      .then((d: StreakData) => setData(d))
      .catch(() => setData(null))
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
      <div style={{ fontSize: 40, lineHeight: 1, flexShrink: 0, color: GOLD, fontWeight: 900, fontFamily: "'Lora', serif" }}>
        {data.current}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1.1 }}>
          {active ? `${data.current} ${dayWord(data.current)} поспіль` : 'Почни свій стрік'}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: FONT, marginTop: 4 }}>
          {active
            ? `Читай щодня, щоб не згубити вогник.${data.longest > data.current ? ` Рекорд: ${data.longest}.` : ''}`
            : 'Прочитай серію сьогодні — і вогник засвітиться.'}
        </div>
        {active && data.freezes > 0 && (
          <div style={{ fontSize: 12, color: GOLD, fontFamily: FONT, marginTop: 6, fontWeight: 700 }}>
            Заморозок про запас: {data.freezes} (пропуск дня не згубить стрік)
          </div>
        )}
      </div>
    </div>
  )
}