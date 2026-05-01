'use client'

import { useState, useRef, useEffect } from 'react'

interface Track {
  id: string
  title: string
  meta: string
  duration: string
  type: 'story' | 'music' | 'calm'
  audioSrc?: string
}

const TRACKS: Track[] = [
  { id: 's1', title: 'Балабони — Серія 1', meta: 'Голос: Панас · ШІ-синтез', duration: '5:17', type: 'story', audioSrc: '/audio/strashna-1.mp3' },
  { id: 's2', title: 'Балабони — Серія 2', meta: 'Голос: Панас · ШІ-синтез', duration: '4:43', type: 'story', audioSrc: '/audio/strashna-2.mp3' },
  { id: 'm1', title: 'Пісня Балабона', meta: 'За Серією 1 · ШІ-музика', duration: '3:24', type: 'music', audioSrc: '/audio/music-1.mp3' },
  { id: 'm2', title: 'Ліс і Тиша', meta: 'За Серією 2 · ШІ-музика', duration: '2:58', type: 'music', audioSrc: '/audio/music-2.mp3' },
  { id: 'c1', title: 'Ранкова сопілка', meta: '528 Гц · Енергія · 80 BPM', duration: '6:00', type: 'calm', audioSrc: '/audio/sopilka-morning.mp3' },
  { id: 'c2', title: 'Карпатський релакс', meta: '432 Гц · Антистрес · Природа', duration: '10:00', type: 'calm', audioSrc: '/audio/carpathian-relax.mp3' },
  { id: 'c3', title: 'Колискова для серця', meta: 'Дельта-хвилі · Глибокий сон · 60 BPM', duration: '12:00', type: 'calm', audioSrc: '/audio/lullaby-heart.mp3' },
]

// Описи терапевтичних треків
const CALM_DESCRIPTIONS: Record<string, string> = {
  'c1': 'Традиційна сопілка + акустична гітара. Пробуджує енергію, піднімає настрій.',
  'c2': 'Фортепіано + звуки гірської річки. Знімає тривогу, заспокоює нервову систему.',
  'c3': 'Калімба + білий шум. Сприяє глибокому сну та відновленню сил.',
}

export default function NeuroMusicSection() {
  const [tab, setTab] = useState<'story' | 'music' | 'calm'>('story')
  const [playing, setPlaying] = useState<string | null>(null)
  const [antipanic, setAntipanic] = useState(false)
  const antipanic_timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const visible = TRACKS.filter(t => t.type === tab)

  const togglePlay = (id: string) => {
    setPlaying(prev => prev === id ? null : id)
  }

  const handleAntipanic = () => {
    setAntipanic(true)
    setTab('calm')
    setPlaying('c1')
    if (antipanic_timeout.current) clearTimeout(antipanic_timeout.current)
    antipanic_timeout.current = setTimeout(() => setAntipanic(false), 5000)
  }

  useEffect(() => () => { if (antipanic_timeout.current) clearTimeout(antipanic_timeout.current) }, [])

  return (
    <section style={{ marginBottom: 56 }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <symbol id="nm-note" viewBox="0 0 24 24" fill="none">
            <path d="M9 18V6l12-2v12" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke="#ef9f27" strokeWidth="1.5"/>
            <circle cx="18" cy="16" r="3" stroke="#ef9f27" strokeWidth="1.5"/>
          </symbol>
          <symbol id="nm-book" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h7a2 2 0 012 2v13a1.5 1.5 0 00-1.5-1.5H4V4z" stroke="#ef9f27" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M20 4h-7a2 2 0 00-2 2v13a1.5 1.5 0 011.5-1.5H20V4z" stroke="#ef9f27" strokeWidth="1.5" strokeLinejoin="round"/>
          </symbol>
          <symbol id="nm-leaf" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6 2 3 8 3 12c0 5 4 9 9 9s9-4 9-9c0-4-2-8-9-10z" stroke="#ef9f27" strokeWidth="1.5"/>
            <path d="M3 12c3-2 6-2 9 0s6 2 9 0" stroke="#ef9f27" strokeWidth="1.5"/>
          </symbol>
          <symbol id="nm-play" viewBox="0 0 24 24" fill="none">
            <polygon points="5,3 19,12 5,21" fill="#ef9f27"/>
          </symbol>
          <symbol id="nm-pause" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="4" width="4" height="16" rx="1" fill="#ef9f27"/>
            <rect x="14" y="4" width="4" height="16" rx="1" fill="#ef9f27"/>
          </symbol>
        </defs>
      </svg>

      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#ef9f27', display: 'block', marginBottom: 8 }}>
        Модуль 2
      </span>

      <div style={{ background: '#0f1e3a', borderRadius: 16, padding: '22px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,159,39,0.1)', border: '0.5px solid rgba(239,159,39,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24"><use href="#nm-note"/></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 500, color: '#f5f0e8' }}>Нейро-музика</div>
          </div>

          {/* Кнопка Антипаніка */}
          <button
            onClick={handleAntipanic}
            style={{
              background: antipanic ? '#16a34a' : '#dc2626',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '10px 16px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: antipanic ? '0 0 20px rgba(22,163,74,0.5)' : '0 0 20px rgba(220,38,38,0.3)',
              transition: 'all 0.3s',
              animation: antipanic ? 'none' : undefined,
            }}
          >
            {antipanic ? '✅ Грає заспокійливе' : '🆘 Антипаніка'}
          </button>
        </div>

        {/* Антипаніка активна */}
        {antipanic && (
          <div style={{
            background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>🌿</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>Режим спокою активовано</div>
              <div style={{ fontSize: 12, color: '#86efac' }}>Дихайте глибоко. Звуки природи вже грають.</div>
            </div>
          </div>
        )}

        <p style={{ fontSize: 16, color: '#8899bb', lineHeight: 1.7, marginBottom: 18 }}>
          Пісні та терапевтична музика, створені штучним інтелектом.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {([
            { key: 'story', label: 'Серіал', icon: '#nm-book' },
            { key: 'music', label: 'Пісня', icon: '#nm-note' },
            { key: 'calm',  label: '🌿 Спокій', icon: '#nm-leaf' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, minHeight: 46, borderRadius: 10,
                border: `0.5px solid ${tab === t.key ? 'rgba(239,159,39,0.45)' : 'rgba(255,255,255,0.15)'}`,
                background: tab === t.key ? 'rgba(239,159,39,0.15)' : 'transparent',
                color: tab === t.key ? '#ef9f27' : '#8899bb',
                fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {t.key !== 'calm' && <svg width="14" height="14"><use href={t.icon}/></svg>}
              {t.label}
            </button>
          ))}
        </div>

        {/* Calm mode banner */}
        {tab === 'calm' && (
          <div style={{ background: 'rgba(239,159,39,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
            Музична терапія · Бінауральні ритми · Звуки природи · Цілющі частоти
          </div>
        )}

        {/* Track list */}
        {visible.map(track => (
          <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(239,159,39,0.1)', border: '0.5px solid rgba(239,159,39,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22">
                <use href={track.type === 'story' ? '#nm-book' : track.type === 'calm' ? '#nm-leaf' : '#nm-note'}/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, color: '#f5f0e8', fontWeight: 500 }}>
                {track.title}
                {(track.type === 'music' || track.type === 'calm') && (
                  <span style={{ fontSize: 10, background: 'rgba(239,159,39,0.18)', color: '#ef9f27', borderRadius: 4, padding: '2px 7px', marginLeft: 8, letterSpacing: 0.5 }}>AI</span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#8899bb', marginTop: 3 }}>{track.meta}</div>
              {track.type === 'calm' && CALM_DESCRIPTIONS[track.id] && (
                <div style={{ fontSize: 11, color: '#556688', marginTop: 4, lineHeight: 1.5 }}>{CALM_DESCRIPTIONS[track.id]}</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#8899bb' }}>{track.duration}</span>
              <button
                onClick={() => togglePlay(track.id)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: playing === track.id ? 'rgba(239,159,39,0.4)' : 'rgba(239,159,39,0.15)', border: '0.5px solid rgba(239,159,39,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="18" height="18"><use href={playing === track.id ? '#nm-pause' : '#nm-play'}/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
