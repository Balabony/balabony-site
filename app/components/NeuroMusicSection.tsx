'use client'

import { useState, useRef, useEffect } from 'react'

interface Track {
  id: string
  title: string
  src: string
}

interface Category {
  id: string
  label: string
  desc: string
  tracks: Track[]
  icon: React.ReactNode
}

const CATEGORIES: Category[] = [
  {
    id: 'son',
    label: 'Сон',
    desc: 'Для глибокого сну',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M24 7 Q14 7 11 16 Q8 25 16 31 Q23 37 31 30 Q22 30 18 23 Q14 16 24 7Z" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1.2" strokeLinejoin="round"/>
        <circle cx="32" cy="10" r="1.8" fill="#D4A017"/>
        <circle cx="28" cy="4" r="1.1" fill="#F5F3EE" opacity="0.7"/>
        <circle cx="36" cy="16" r="1.1" fill="#F5F3EE" opacity="0.5"/>
        <circle cx="29" cy="16" r="0.8" fill="#D4A017" opacity="0.5"/>
      </svg>
    ),
    tracks: [
      { id: 'son-01', title: 'Колискова для дорослих', src: '/music/son/01.mp3' },
      { id: 'son-02', title: 'Глибокий сон', src: '/music/son/02.mp3' },
      { id: 'son-03', title: 'Дельта-хвилі', src: '/music/son/03.mp3' },
      { id: 'son-04', title: 'Нічний спокій', src: '/music/son/04.mp3' },
      { id: 'son-05', title: 'Острів снів', src: '/music/son/05.mp3' },
      { id: 'son-06', title: 'Сонне царство', src: '/music/son/06.mp3' },
      { id: 'son-07', title: 'Хмари і місяць', src: '/music/son/07.mp3' },
      { id: 'son-08', title: 'Тихий берег', src: '/music/son/08.mp3' },
      { id: 'son-09', title: 'Пісня зірок', src: '/music/son/09.mp3' },
      { id: 'son-10', title: 'Нічна медитація', src: '/music/son/10.mp3' },
    ],
  },
  {
    id: 'meditacia',
    label: 'Медитація',
    desc: 'Спокій і зосередженість',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="17" stroke="rgba(212,160,23,0.25)" strokeWidth="1"/>
        <circle cx="20" cy="20" r="12" stroke="rgba(212,160,23,0.45)" strokeWidth="1"/>
        <circle cx="20" cy="20" r="7" stroke="#D4A017" strokeWidth="1.2"/>
        <circle cx="20" cy="20" r="2.5" fill="#D4A017"/>
      </svg>
    ),
    tracks: [
      { id: 'med-01', title: 'Ранкова медитація', src: '/music/meditacia/01.mp3' },
      { id: 'med-02', title: 'Дихання і спокій', src: '/music/meditacia/02.mp3' },
      { id: 'med-03', title: 'Тета-хвилі', src: '/music/meditacia/03.mp3' },
      { id: 'med-04', title: 'Потік свідомості', src: '/music/meditacia/04.mp3' },
      { id: 'med-05', title: 'Внутрішній простір', src: '/music/meditacia/05.mp3' },
      { id: 'med-06', title: 'Серцевий ритм', src: '/music/meditacia/06.mp3' },
      { id: 'med-07', title: 'Гармонія душі', src: '/music/meditacia/07.mp3' },
      { id: 'med-08', title: 'Світло всередині', src: '/music/meditacia/08.mp3' },
      { id: 'med-09', title: 'Мовчання розуму', src: '/music/meditacia/09.mp3' },
      { id: 'med-10', title: 'Повний спокій', src: '/music/meditacia/10.mp3' },
    ],
  },
  {
    id: 'stres',
    label: 'Антистрес',
    desc: 'Зняття напруги і тривоги',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M3 13 Q9 9 15 13 Q21 17 27 13 Q33 9 37 13" stroke="#D4A017" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d="M3 20 Q9 16 15 20 Q21 24 27 20 Q33 16 37 20" stroke="#D4A017" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65"/>
        <path d="M3 27 Q9 23 15 27 Q21 31 27 27 Q33 23 37 27" stroke="#D4A017" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.35"/>
      </svg>
    ),
    tracks: [
      { id: 'str-01', title: 'Відпускаю тривогу', src: '/music/stres/01.mp3' },
      { id: 'str-02', title: 'Спокійне дихання', src: '/music/stres/02.mp3' },
      { id: 'str-03', title: 'Альфа-хвилі', src: '/music/stres/03.mp3' },
      { id: 'str-04', title: 'Гармонія тіла', src: '/music/stres/04.mp3' },
      { id: 'str-05', title: "М'які вібрації", src: '/music/stres/05.mp3' },
      { id: 'str-06', title: 'Зняття напруги', src: '/music/stres/06.mp3' },
      { id: 'str-07', title: 'Рівновага думок', src: '/music/stres/07.mp3' },
      { id: 'str-08', title: 'Тихий притулок', src: '/music/stres/08.mp3' },
      { id: 'str-09', title: 'Безпечний простір', src: '/music/stres/09.mp3' },
      { id: 'str-10', title: 'Глибоке розслаблення', src: '/music/stres/10.mp3' },
    ],
  },
  {
    id: 'ranok',
    label: 'Ранок',
    desc: 'Енергія і бадьорість',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="21" r="8" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1.2"/>
        <line x1="20" y1="4" x2="20" y2="9" stroke="#D4A017" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="20" y1="33" x2="20" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4" y1="21" x2="9" y2="21" stroke="#D4A017" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="31" y1="21" x2="36" y2="21" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8.6" y1="9.6" x2="12.2" y2="13.2" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="27.8" y1="28.8" x2="31.4" y2="32.4" stroke="#D4A017" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="31.4" y1="9.6" x2="27.8" y2="13.2" stroke="#D4A017" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="12.2" y1="28.8" x2="8.6" y2="32.4" stroke="#D4A017" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    tracks: [
      { id: 'ran-01', title: 'Схід сонця', src: '/music/ranok/01.mp3' },
      { id: 'ran-02', title: 'Ранкова роса', src: '/music/ranok/02.mp3' },
      { id: 'ran-03', title: 'Перші промені', src: '/music/ranok/03.mp3' },
      { id: 'ran-04', title: 'Пробудження природи', src: '/music/ranok/04.mp3' },
      { id: 'ran-05', title: 'Ранкові птахи', src: '/music/ranok/05.mp3' },
      { id: 'ran-06', title: 'Свіжий ранок', src: '/music/ranok/06.mp3' },
      { id: 'ran-07', title: 'Новий день', src: '/music/ranok/07.mp3' },
      { id: 'ran-08', title: 'Ранкова прогулянка', src: '/music/ranok/08.mp3' },
      { id: 'ran-09', title: 'Ранковий чай', src: '/music/ranok/09.mp3' },
      { id: 'ran-10', title: 'Заряд бадьорості', src: '/music/ranok/10.mp3' },
    ],
  },
  {
    id: 'pryroda',
    label: 'Природа',
    desc: 'Звуки живого лісу',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 4 L7 22 L14 22 L10 34 L30 34 L26 22 L33 22 Z" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2" strokeLinejoin="round"/>
        <line x1="20" y1="34" x2="20" y2="38" stroke="#D4A017" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    tracks: [
      { id: 'pry-01', title: 'Ліс після дощу', src: '/music/pryroda/01.mp3' },
      { id: 'pry-02', title: 'Спів птахів', src: '/music/pryroda/02.mp3' },
      { id: 'pry-03', title: 'Шелест листя', src: '/music/pryroda/03.mp3' },
      { id: 'pry-04', title: 'Струмок у горах', src: '/music/pryroda/04.mp3' },
      { id: 'pry-05', title: 'Вітер у полі', src: '/music/pryroda/05.mp3' },
      { id: 'pry-06', title: 'Море на світанку', src: '/music/pryroda/06.mp3' },
      { id: 'pry-07', title: 'Гірське повітря', src: '/music/pryroda/07.mp3' },
      { id: 'pry-08', title: 'Лісова тиша', src: '/music/pryroda/08.mp3' },
      { id: 'pry-09', title: 'Квітучий луг', src: '/music/pryroda/09.mp3' },
      { id: 'pry-10', title: 'Захід над лісом', src: '/music/pryroda/10.mp3' },
    ],
  },
  {
    id: 'dosch',
    label: 'Дощ',
    desc: 'Заспокійливі звуки дощу',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M10 21 Q9 13 17 11 Q19 5 26 7 Q34 7 34 15 Q39 15 39 21 Q39 25 33 25 L9 25 Q4 25 4 20 Q4 15 10 15Z" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2" strokeLinejoin="round"/>
        <line x1="13" y1="29" x2="10" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="21" y1="29" x2="18" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="29" y1="29" x2="26" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="35" y1="29" x2="32" y2="35" stroke="#D4A017" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
    tracks: [
      { id: 'dos-01', title: 'Дощ на склі', src: '/music/dosch/01.mp3' },
      { id: 'dos-02', title: 'Гроза і дощ', src: '/music/dosch/02.mp3' },
      { id: 'dos-03', title: 'Крапелі з даху', src: '/music/dosch/03.mp3' },
      { id: 'dos-04', title: 'Осінній дощ', src: '/music/dosch/04.mp3' },
      { id: 'dos-05', title: 'Дощ і вогонь', src: '/music/dosch/05.mp3' },
      { id: 'dos-06', title: 'Злива і грім', src: '/music/dosch/06.mp3' },
      { id: 'dos-07', title: 'Тихий дощ у місті', src: '/music/dosch/07.mp3' },
      { id: 'dos-08', title: 'Дощ на горищі', src: '/music/dosch/08.mp3' },
      { id: 'dos-09', title: 'Після зливи', src: '/music/dosch/09.mp3' },
      { id: 'dos-10', title: 'Ніч і дощ', src: '/music/dosch/10.mp3' },
    ],
  },
]

export default function NeuroMusicSection() {
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentSec, setCurrentSec] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
        setCurrentSec(audio.currentTime)
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrentSec(0) }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const handleCatClick = (catId: string) => {
    setOpenCat(prev => prev === catId ? null : catId)
  }

  const handleTrackClick = (track: Track) => {
    const audio = audioRef.current
    if (!audio) return
    if (activeId === track.id) {
      if (audio.paused) { audio.play().catch(() => {}) }
      else { audio.pause() }
      return
    }
    audio.src = track.src
    audio.play().catch(() => {})
    setActiveId(track.id)
    setProgress(0)
    setCurrentSec(0)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const openCategory = CATEGORIES.find(c => c.id === openCat)

  return (
    <section style={{ marginBottom: 56 }}>
      <audio ref={audioRef} />

      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#ef9f27', display: 'block', marginBottom: 8 }}>
        Модуль 2
      </span>

      <div style={{ background: '#0f1e3a', borderRadius: 16, padding: '22px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,159,39,0.1)', border: '0.5px solid rgba(239,159,39,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M7 20V8l14-3v12" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="5" cy="20" r="2.5" stroke="#ef9f27" strokeWidth="1.5"/>
              <circle cx="19" cy="17" r="2.5" stroke="#ef9f27" strokeWidth="1.5"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#f5f0e8' }}>Нейро-музика</div>
        </div>

        <p style={{ fontSize: 16, color: '#8899bb', lineHeight: 1.7, marginBottom: 18 }}>
          Терапевтична музика для сну, медитації та зняття стресу. Вибери категорію та насолоджуйся.
        </p>

        {/* Category grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: openCat ? 16 : 0 }}>
          {CATEGORIES.map(cat => {
            const isOpen = openCat === cat.id
            return (
              <div
                key={cat.id}
                onClick={() => handleCatClick(cat.id)}
                style={{
                  background: isOpen ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `0.5px solid ${isOpen ? '#D4A017' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 14, padding: '18px 12px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  {cat.icon}
                </div>
                <div style={{ fontSize: 15, color: isOpen ? '#D4A017' : '#f5f0e8', fontWeight: 500 }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4 }}>{cat.desc}</div>
              </div>
            )
          })}
        </div>

        {/* Track list */}
        {openCategory && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#D4A017', marginBottom: 10 }}>
              {openCategory.label} · {openCategory.tracks.length} треків
            </div>
            {openCategory.tracks.map((track, idx) => {
              const isActive = activeId === track.id
              const trackPlaying = isActive && isPlaying
              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6,
                    background: isActive ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `0.5px solid ${isActive ? '#D4A017' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Play/pause circle */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: isActive ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.07)',
                    border: `0.5px solid ${isActive ? '#D4A017' : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {trackPlaying ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="2" y="2" width="4" height="10" rx="1" fill="#D4A017"/>
                        <rect x="8" y="2" width="4" height="10" rx="1" fill="#D4A017"/>
                      </svg>
                    ) : isActive ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <polygon points="3,2 12,7 3,12" fill="#D4A017"/>
                      </svg>
                    ) : (
                      <span style={{ fontSize: 11, color: '#8899bb', fontWeight: 500 }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {/* Title + progress */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#D4A017' : '#f5f0e8',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {track.title}
                    </div>
                    {isActive && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 2, background: '#D4A017', width: `${progress}%`, transition: 'width 0.5s linear' }}/>
                        </div>
                        <div style={{ fontSize: 11, color: '#8899bb', marginTop: 3 }}>{fmt(currentSec)}</div>
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <span style={{ fontSize: 12, color: '#8899bb', flexShrink: 0 }}>10 хв</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
