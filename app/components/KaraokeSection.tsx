'use client'

import { useState, useRef, useEffect } from 'react'

interface LyricLine {
  time: number
  text: string
}

interface KaraokeSectionProps {
  audioSrc?: string
  lyrics?: LyricLine[]
}

/* ─── ЧЕРВОНА РУТА — LRC таймкоди ───
   Замініть audioSrc на реальний URL з Supabase Storage
   URL формат: https://[project].supabase.co/storage/v1/object/public/audio/chervona-ruta.mp3
*/
const CHERVONA_RUTA_LYRICS: LyricLine[] = [
  { time: 15, text: 'Ти признайся мені, звідки в тебе ті чари' },
  { time: 22, text: 'Я без тебе всі дні у полоні печалі' },
  { time: 30, text: 'Червону руту не шукай вечорами' },
  { time: 37, text: 'Ти у мене єдина, тільки ти, повір' },
  { time: 44, text: 'Бо твоя врода — то є чистая вода' },
  { time: 51, text: 'То є бистрая вода з синіх гір' },
]

/* ─── URL аудіо — замінити на реальний після завантаження в Supabase ─── */
const AUDIO_URL = 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/Audio/chervona-ruta.mp3'

export default function KaraokeSection({ audioSrc = AUDIO_URL, lyrics = CHERVONA_RUTA_LYRICS }: KaraokeSectionProps) {
  const audioRef  = useRef<HTMLAudioElement>(null)
  const lyricsRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying]         = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeIdx, setActiveIdx]     = useState(-1)

  /* Визначаємо активний рядок по currentTime */
  useEffect(() => {
    const idx = [...lyrics].reverse().findIndex(l => l.time <= currentTime)
    setActiveIdx(idx === -1 ? -1 : lyrics.length - 1 - idx)
  }, [currentTime, lyrics])

  /* Авто-скрол до активного рядка */
  useEffect(() => {
    if (lyricsRef.current && activeIdx >= 0) {
      const el = lyricsRef.current.children[activeIdx] as HTMLElement
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIdx])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => {
        /* Якщо файл ще не завантажено — симулюємо для демо */
        simulateDemo()
      })
      setPlaying(true)
    }
  }

  /* Демо-режим: якщо аудіо недоступне — симулюємо підсвічування */
  const demoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const simulateDemo = () => {
    if (demoRef.current) return
    let sec = 14
    demoRef.current = setInterval(() => {
      sec++
      setCurrentTime(sec)
      if (sec >= 58) {
        clearInterval(demoRef.current!)
        demoRef.current = null
        setPlaying(false)
        setCurrentTime(0)
        setActiveIdx(-1)
      }
    }, 1000)
  }

  useEffect(() => {
    return () => { if (demoRef.current) clearInterval(demoRef.current) }
  }, [])

  return (
    <section style={{ marginBottom: 56 }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <symbol id="k-mic" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" stroke="#ef9f27" strokeWidth="1.5"/>
            <path d="M5 11a7 7 0 0014 0" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="18" x2="12" y2="22" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="9" y1="22" x2="15" y2="22" stroke="#ef9f27" strokeWidth="1.5" strokeLinecap="round"/>
          </symbol>
        </defs>
      </svg>

      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 2,
        textTransform: 'uppercase', color: '#ef9f27',
        display: 'block', marginBottom: 8
      }}>
        Модуль 1
      </span>

      <div style={{ background: '#0f1e3a', borderRadius: 16, padding: '22px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(239,159,39,0.1)',
            border: '0.5px solid rgba(239,159,39,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="24" height="24"><use href="#k-mic"/></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#f5f0e8' }}>КАРАОКЕ</div>
        </div>

        <p style={{ fontSize: 16, color: '#8899bb', lineHeight: 1.7, marginBottom: 4 }}>
          Червона рута · Назарій Яремчук
        </p>
        <p style={{ fontSize: 13, color: '#556688', marginBottom: 18 }}>
          Натисніть «Розпочати» — текст підсвічуватиметься під музику
        </p>

        {/* Лірика */}
        <div
          ref={lyricsRef}
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 12, padding: 16,
            marginBottom: 18, maxHeight: 240, overflowY: 'auto',
          }}
        >
          {lyrics.map((line, i) => {
            const isActive = i === activeIdx
            const isDone   = i < activeIdx
            return (
              <div
                key={i}
                style={{
                  fontSize: isActive ? 26 : 22,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#ef9f27' : isDone ? '#f5f0e8' : '#7a8fa8',
                  lineHeight: 1.8,
                  padding: '3px 0',
                  transition: 'all 0.4s ease',
                }}
              >
                {line.text}
              </div>
            )
          })}
        </div>

        {/* Прихований аудіо елемент */}
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onEnded={() => { setPlaying(false); setCurrentTime(0); setActiveIdx(-1) }}
        />

        {/* Прогрес */}
        {playing && (
          <div style={{
            height: 3, background: 'rgba(255,255,255,0.1)',
            borderRadius: 2, marginBottom: 14, overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', background: '#ef9f27',
              width: `${Math.min(100, ((currentTime - 14) / 44) * 100)}%`,
              transition: 'width 0.5s linear', borderRadius: 2,
            }} />
          </div>
        )}

        {/* Кнопки */}
        <button
          onClick={toggle}
          style={{
            width: '100%', minHeight: 56, borderRadius: 12,
            border: 'none', background: '#ef9f27',
            color: '#fff', fontSize: 17, fontWeight: 500,
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 10,
          }}
        >
          {playing ? '❚❚  Пауза' : '▶  Розпочати'}
        </button>

        <button style={{
          width: '100%', minHeight: 56, borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '0.5px solid rgba(255,255,255,0.18)',
          color: '#f5f0e8', fontSize: 17, fontWeight: 500, cursor: 'pointer',
        }}>
          Обрати іншу пісню
        </button>
      </div>
    </section>
  )
}
