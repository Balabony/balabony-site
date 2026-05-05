'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'balabony-v2-progress'

interface SavedProgress {
  mood: string
  idx: number
  sec: number
  title?: string
  ts: number
}

function fmt(sec: number) {
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const MOOD_LABELS: Record<string, string> = {
  happy: 'Весела', sad: 'Сумна', scary: 'Страшна',
  vesela: 'Весела', sumna: 'Сумна', strashna: 'Страшна',
}

const STORY_TITLES: Record<string, string[]> = {
  happy:    ['Пригоди Зайченяти (Серія 1)', 'Пригоди Зайченяти (Серія 2)', 'Смішний Кіндрат (Серія 1)'],
  sad:      ['Осінній Листочок (Серія 1)', 'Загублений Зірковий (Серія 1)'],
  scary:    ['Балабони (Серія 1)', 'Темний Ліс (Серія 2)', 'Замок Тіней (Серія 3)'],
  vesela:   ['Пригоди Зайченяти (Серія 1)', 'Пригоди Зайченяти (Серія 2)'],
  sumna:    ['Осінній Листочок (Серія 1)', 'Загублений Зірковий (Серія 1)'],
  strashna: ['Балабони (Серія 1)', 'Темний Ліс (Серія 2)', 'Замок Тіней (Серія 3)'],
}

export default function ResumeBanner() {
  const [progress, setProgress] = useState<SavedProgress | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const saved: SavedProgress = JSON.parse(raw)
      const week = 7 * 24 * 3600 * 1000
      if (saved.sec > 10 && Date.now() - saved.ts < week) {
        // Додаємо назву серії
        const titles = STORY_TITLES[saved.mood] || []
        saved.title = titles[saved.idx] || `Серія ${saved.idx + 1}`
        setProgress(saved)
      }
    } catch (_) {}
  }, [])

  if (!progress || dismissed) return null

  const moodLabel = MOOD_LABELS[progress.mood] || progress.mood
  const timeStr   = fmt(progress.sec)

  return (
    <div style={{
      background: '#1a2845',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 5%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      opacity: 0.95,
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Icon + text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Play icon */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(255,184,0,0.12)',
          border: '1.5px solid #FFB800',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </div>

        <div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>
            Ви зупинились на
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
            {progress.title}
            <span style={{
              marginLeft: 8, fontSize: 11,
              background: 'rgba(255,184,0,0.12)',
              color: '#FFB800', borderRadius: 4,
              padding: '2px 7px',
            }}>
              {moodLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          Зупинка: {timeStr}
        </span>
        <a
          href="#player"
          onClick={() => {
            // Передаємо прогрес в плеєр через localStorage (вже збережено)
            setDismissed(true)
          }}
          style={{
            background: 'transparent', color: '#FFB800',
            border: '1.5px solid #FFB800', borderRadius: 8,
            padding: '8px 18px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer',
            textDecoration: 'none',
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Продовжити з {timeStr}
        </a>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none', border: 'none',
            color: 'var(--muted)', fontSize: 18,
            cursor: 'pointer', lineHeight: 1, padding: '4px 8px',
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
