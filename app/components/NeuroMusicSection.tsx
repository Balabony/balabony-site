'use client'

import { useState, useRef, useEffect } from 'react'

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dxiesituw/video/upload/'
const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#D4A017'

interface Track { id: string; title: string; src: string }
interface Category {
  id: string; label: string; desc: string
  tracks: Track[]; icon: React.ReactNode; comingSoon?: boolean
}

const SLEEP_TRACKS: Track[] = [
  { id: 'sleep-01', title: 'Трек 1', src: `${CLOUDINARY_BASE}sleep-01_yzcy9q.mp3` },
  { id: 'sleep-02', title: 'Трек 2', src: `${CLOUDINARY_BASE}sleep-02_v6pb6o.mp3` },
  { id: 'sleep-03', title: 'Трек 3', src: `${CLOUDINARY_BASE}sleep-03_wyefu9.mp3` },
  { id: 'sleep-04', title: 'Трек 4', src: `${CLOUDINARY_BASE}sleep-04_fhcz47.mp3` },
]

const CATEGORIES: Category[] = [
  {
    id: 'son', label: 'Сон', desc: 'Для глибокого сну',
    tracks: SLEEP_TRACKS,
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M24 7 Q14 7 11 16 Q8 25 16 31 Q23 37 31 30 Q22 30 18 23 Q14 16 24 7Z" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1.2" strokeLinejoin="round"/>
        <circle cx="32" cy="10" r="1.8" fill="#D4A017"/>
        <circle cx="28" cy="4" r="1.1" fill="#F5F3EE" opacity="0.7"/>
        <circle cx="36" cy="16" r="1.1" fill="#F5F3EE" opacity="0.5"/>
        <circle cx="29" cy="16" r="0.8" fill="#D4A017" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 'meditacia', label: 'Медитація', desc: 'Спокій і зосередженість',
    comingSoon: true, tracks: [],
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="17" stroke="rgba(212,160,23,0.25)" strokeWidth="1"/>
        <circle cx="20" cy="20" r="12" stroke="rgba(212,160,23,0.45)" strokeWidth="1"/>
        <circle cx="20" cy="20" r="7" stroke="#D4A017" strokeWidth="1.2"/>
        <circle cx="20" cy="20" r="2.5" fill="#D4A017"/>
      </svg>
    ),
  },
  {
    id: 'stres', label: 'Антистрес', desc: 'Зняття напруги і тривоги',
    comingSoon: true, tracks: [],
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M3 13 Q9 9 15 13 Q21 17 27 13 Q33 9 37 13" stroke="#D4A017" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d="M3 20 Q9 16 15 20 Q21 24 27 20 Q33 16 37 20" stroke="#D4A017" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65"/>
        <path d="M3 27 Q9 23 15 27 Q21 31 27 27 Q33 23 37 27" stroke="#D4A017" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.35"/>
      </svg>
    ),
  },
  {
    id: 'ranok', label: 'Ранок', desc: 'Енергія і бадьорість',
    comingSoon: true, tracks: [],
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
  },
  {
    id: 'pryroda', label: 'Природа', desc: 'Звуки живого лісу',
    comingSoon: true, tracks: [],
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 4 L7 22 L14 22 L10 34 L30 34 L26 22 L33 22 Z" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2" strokeLinejoin="round"/>
        <line x1="20" y1="34" x2="20" y2="38" stroke="#D4A017" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'dosch', label: 'Дощ', desc: 'Заспокійливі звуки дощу',
    comingSoon: true, tracks: [],
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M10 21 Q9 13 17 11 Q19 5 26 7 Q34 7 34 15 Q39 15 39 21 Q39 25 33 25 L9 25 Q4 25 4 20 Q4 15 10 15Z" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2" strokeLinejoin="round"/>
        <line x1="13" y1="29" x2="10" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="21" y1="29" x2="18" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="29" y1="29" x2="26" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="35" y1="29" x2="32" y2="35" stroke="#D4A017" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
  },
]

function VolumeIcon({ v }: { v: number }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 6.5 L2 11.5 L5.5 11.5 L10 15 L10 3 L5.5 6.5 Z" fill={v === 0 ? '#445566' : '#8899bb'}/>
      {v > 0 && <path d="M12 5.5 Q14.5 9 12 12.5" stroke="#8899bb" strokeWidth="1.3" fill="none" strokeLinecap="round"/>}
      {v > 0.5 && <path d="M14 3.5 Q17.5 9 14 14.5" stroke="#8899bb" strokeWidth="1.1" fill="none" strokeLinecap="round"/>}
    </svg>
  )
}

export default function NeuroMusicSection() {
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentSec, setCurrentSec] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
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
    const onMeta = () => setDuration(audio.duration || 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrentSec(0) }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const handleCatClick = (catId: string) => setOpenCat(prev => prev === catId ? null : catId)

  const handleTrackClick = (track: Track) => {
    const audio = audioRef.current
    if (!audio) return
    if (activeId === track.id) {
      audio.paused ? audio.play().catch(() => {}) : audio.pause()
      return
    }
    audio.src = track.src
    audio.volume = volume
    audio.play().catch(() => {})
    setActiveId(track.id)
    setProgress(0); setCurrentSec(0); setDuration(0)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const audio = audioRef.current
    if (audio && audio.duration) audio.currentTime = pct * audio.duration
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const openCategory = CATEGORIES.find(c => c.id === openCat)

  return (
    <section style={{ marginBottom: 56 }}>
      <audio ref={audioRef} />

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

        {/* Category grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: openCat ? 16 : 0 }}>
          {CATEGORIES.map(cat => {
            const isOpen = openCat === cat.id
            return (
              <div key={cat.id} onClick={() => handleCatClick(cat.id)} style={{
                background: isOpen ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.05)',
                border: `0.5px solid ${isOpen ? GOLD : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '18px 12px', cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.2s', position: 'relative',
              }}>
                {cat.comingSoon && (
                  <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: '#556688', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 5px', fontFamily: FONT }}>
                    СКОРО
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 15, color: isOpen ? GOLD : '#f5f0e8', fontWeight: 500, fontFamily: "'Lora', serif" }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4, fontFamily: "'Lora', serif" }}>{cat.desc}</div>
              </div>
            )
          })}
        </div>

        {/* Panel below grid */}
        {openCategory && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: GOLD, marginBottom: 12, fontFamily: FONT }}>
              {openCategory.label}{!openCategory.comingSoon ? ` · ${openCategory.tracks.length} треки` : ''}
            </div>

            {openCategory.comingSoon ? (
              /* ── Coming soon panel ── */
              <div style={{ textAlign: 'center', padding: '32px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '0.5px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#f5f0e8', marginBottom: 8, fontFamily: FONT }}>Незабаром</div>
                <div style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT, lineHeight: 1.65 }}>
                  Треки категорії «{openCategory.label}» з&apos;являться найближчим часом.<br/>
                  Поки що насолоджуйтесь музикою для сну 🌙
                </div>
                <button onClick={() => setOpenCat('son')} style={{ marginTop: 16, background: 'rgba(212,160,23,0.15)', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  Слухати «Сон»
                </button>
              </div>
            ) : (
              /* ── Sleep track list + player ── */
              <>
                {openCategory.tracks.map((track, idx) => {
                  const isActive = activeId === track.id
                  const playing = isActive && isPlaying
                  return (
                    <div key={track.id} onClick={() => handleTrackClick(track)} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer', marginBottom: 6,
                      background: isActive ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `0.5px solid ${isActive ? GOLD : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.15s', fontFamily: FONT,
                    }}>
                      {/* Play/pause button */}
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: isActive ? 'rgba(212,160,23,0.22)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${isActive ? GOLD : 'rgba(255,255,255,0.12)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {playing ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="2" y="2" width="4" height="10" rx="1" fill={GOLD}/>
                            <rect x="8" y="2" width="4" height="10" rx="1" fill={GOLD}/>
                          </svg>
                        ) : isActive ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <polygon points="3,2 12,7 3,12" fill={GOLD}/>
                          </svg>
                        ) : (
                          <span style={{ fontSize: 13, color: '#556688', fontWeight: 700, fontFamily: FONT }}>{idx + 1}</span>
                        )}
                      </div>

                      {/* Track info + progress */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: isActive ? 600 : 400, color: isActive ? GOLD : '#f5f0e8', fontFamily: FONT }}>
                          {track.title}
                        </div>

                        {isActive && (
                          <div style={{ marginTop: 8 }}>
                            {/* Seekable progress bar */}
                            <div onClick={seek} style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', cursor: 'pointer' }}>
                              <div style={{ height: '100%', borderRadius: 3, background: GOLD, width: `${progress}%`, transition: 'width 0.5s linear' }}/>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                              <span style={{ fontSize: 11, color: '#8899bb', fontFamily: FONT }}>{fmt(currentSec)}</span>
                              {duration > 0 && <span style={{ fontSize: 11, color: '#556688', fontFamily: FONT }}>{fmt(duration)}</span>}
                            </div>
                          </div>
                        )}
                      </div>

                      {playing && (
                        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16, flexShrink: 0 }}>
                          {[8, 14, 10, 16, 11].map((h, i) => (
                            <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: GOLD, opacity: 0.85 }}/>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Volume control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginTop: 10, border: '0.5px solid rgba(255,255,255,0.07)' }}>
                  <VolumeIcon v={volume} />
                  <input
                    type="range" min={0} max={100} value={Math.round(volume * 100)}
                    onChange={e => { e.stopPropagation(); setVolume(Number(e.target.value) / 100) }}
                    style={{ flex: 1, accentColor: GOLD, cursor: 'pointer' } as React.CSSProperties}
                  />
                  <span style={{ fontSize: 11, color: '#8899bb', width: 30, textAlign: 'right', fontFamily: FONT, flexShrink: 0 }}>
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
