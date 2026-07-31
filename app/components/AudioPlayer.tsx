'use client'

import React, { useState, useRef, useEffect } from 'react'
import { trackStoryEvent } from '@/lib/analytics'
import { AudioWaveIcon } from './AudioBadge'

// ============================================================
// AudioPlayer — справжній плеєр, керований пропсами.
//
// Поведінка (ТЗ Блок 1.3):
//   • audioStatus === 'ready' і є audioUrl → програвати реальний <audio>;
//   • інакше, якщо передано title → чесний стан «аудіоверсія у розробці»;
//   • якщо пропсів нема (напр. сторінка-список) → не рендеримо нічого.
//
// Жодного плеєра без файлу. Жодної симуляції прогресу.
// ============================================================

interface AudioPlayerProps {
  audioUrl?: string | null
  audioStatus?: 'pending' | 'processing' | 'ready' | 'failed' | string | null
  title?: string
  /**
   * uuid запису в `content`. Потрібен, щоб події слухання лягали привʼязаними
   * одразу, а не шукалися заднім числом за назвою. Якщо не передано —
   * лишається старий шлях через назву (менш надійний: назви бувають однакові
   * й змінюються).
   */
  contentId?: string | null
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0]

// Sleep timer — опції у хвилинах; 'end' = до кінця епізоду; null = вимкнено.
type SleepOption = 15 | 30 | 45 | 'end' | null
const SLEEP_OPTIONS: SleepOption[] = [15, 30, 45, 'end', null]
function sleepLabel(o: SleepOption): string {
  if (o === null) return 'Таймер сну: вимк.'
  if (o === 'end') return 'Таймер сну: до кінця епізоду'
  return `Таймер сну: ${o} хв`
}
function sleepShort(o: SleepOption): string {
  if (o === null) return '⏾'
  if (o === 'end') return '⏾ кін.'
  return `⏾ ${o}`
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return m + ':' + (sec < 10 ? '0' : '') + sec
}

export default function AudioPlayer({ audioUrl, audioStatus, title, contentId }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(0)
  const [sleepIdx, setSleepIdx] = useState(SLEEP_OPTIONS.length - 1) // старт = null (вимк.)
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openTracked = useRef(false)
  const readTracked = useRef(false)

  const sleepOption = SLEEP_OPTIONS[sleepIdx]

  const ready = audioStatus === 'ready' && !!audioUrl

  // Скидаємо стан, якщо змінилося джерело аудіо.
  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
    openTracked.current = false
    readTracked.current = false
  }, [audioUrl])

  // Тримаємо швидкість синхронною з реальним елементом.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[speedIdx]
  }, [speedIdx, ready])

  // Sleep timer: для хвилинних опцій ставимо таймаут на паузу.
  // Опція 'end' обробляється через onEnded аудіо, тут таймаут не потрібен.
  // Таймер відлічується лише поки реально грає; на паузі — зупиняється.
  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current)
      sleepTimerRef.current = null
    }
    if (!playing) return
    if (typeof sleepOption !== 'number') return // null або 'end' — без таймауту

    sleepTimerRef.current = setTimeout(() => {
      const a = audioRef.current
      if (a) a.pause()
      setSleepIdx(SLEEP_OPTIONS.length - 1) // скинути на «вимк.» після спрацювання
    }, sleepOption * 60 * 1000)

    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current)
        sleepTimerRef.current = null
      }
    }
  }, [sleepOption, playing])

  // Скидаємо таймер сну при зміні епізоду.
  useEffect(() => {
    setSleepIdx(SLEEP_OPTIONS.length - 1)
  }, [audioUrl])

  // --- Стан «аудіо у розробці» (чесно, без плеєра) ---
  if (!ready) {
    if (!title) return null
    return (
      <div
        role="status"
        style={{
          position: 'fixed', bottom: 'var(--bb-offset, 0px)', left: 0, width: '100%',
          background: '#14253B', color: '#FAC775',
          borderTop: '1px solid rgba(239,159,39,0.4)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.3)', zIndex: 200,
          padding: '12px 4%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, fontFamily: "'Montserrat', sans-serif", fontSize: 14, fontWeight: 600,
        }}
      >
        <AudioWaveIcon size={18} color="#FAC775" />
        <span>Аудіоверсія у розробці</span>
      </div>
    )
  }

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      void a.play()
      if (!openTracked.current && title) {
        openTracked.current = true
        trackStoryEvent(contentId ?? title, title, 'open')
      }
    } else {
      a.pause()
    }
  }

  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEEDS.length)
  const cycleSleep = () => setSleepIdx((i) => (i + 1) % SLEEP_OPTIONS.length)

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !duration) return
    const bar = e.currentTarget
    const ratio = Math.min(Math.max(e.nativeEvent.offsetX / bar.offsetWidth, 0), 1)
    a.currentTime = ratio * duration
    setCurrent(a.currentTime)
  }

  // Клавіатура: Space/Enter — пауза; стрілки — ±10 с.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault(); togglePlay()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); a.currentTime = Math.min(a.currentTime + 10, duration || a.currentTime + 10)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); a.currentTime = Math.max(a.currentTime - 10, 0)
    }
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div
      onKeyDown={onKeyDown}
      style={{
        position: 'fixed', bottom: 'var(--bb-offset, 0px)', left: 0, width: '100%',
        background: 'var(--dark, #0E1A2B)', color: '#fff',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3)', zIndex: 200,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setSleepIdx(SLEEP_OPTIONS.length - 1) // епізод завершився — таймер сну скинути
          if (!readTracked.current && title) {
            readTracked.current = true
            trackStoryEvent(contentId ?? title, title, 'read', Math.round(duration))
          }
        }}
      />

      {/* Смужка прогресу */}
      <div
        onClick={onSeek}
        role="slider"
        aria-label="Перемотування аудіо"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(current)}
        tabIndex={0}
        style={{ height: 6, background: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}
      >
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-gold, #EF9F27)' }} />
      </div>

      <div style={{ padding: '10px 4%', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Відтворення / пауза */}
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Пауза' : 'Відтворити'}
          style={{
            width: 44, height: 44, background: 'var(--accent-gold, #EF9F27)', borderRadius: '50%',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          {playing ? (
            <div style={{ display: 'flex', gap: 3 }}>
              <span style={{ display: 'block', width: 3, height: 12, background: '#fff', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 3, height: 12, background: '#fff', borderRadius: 2 }} />
            </div>
          ) : (
            <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '11px solid #fff', marginLeft: 2 }} />
          )}
        </button>

        {/* Час */}
        <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0, minWidth: 84 }}>
          {fmt(current)} / {fmt(duration)}
        </span>

        {title && (
          <span style={{ fontSize: 13, color: '#B5D4F4', fontFamily: "'Montserrat', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {title}
          </span>
        )}

        {/* Швидкість */}
        <button
          onClick={cycleSpeed}
          aria-label={`Швидкість ${SPEEDS[speedIdx].toFixed(2)}×`}
          style={{
            fontSize: 11, fontWeight: 700, border: '1px solid #475569', color: '#94a3b8',
            padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: 'transparent',
            fontFamily: "'Montserrat', sans-serif", flexShrink: 0,
          }}
        >
          {SPEEDS[speedIdx].toFixed(1)}×
        </button>

        {/* Таймер сну */}
        <button
          onClick={cycleSleep}
          aria-label={sleepLabel(sleepOption)}
          title={sleepLabel(sleepOption)}
          style={{
            fontSize: 11, fontWeight: 700,
            border: sleepOption !== null ? '1px solid var(--accent-gold, #EF9F27)' : '1px solid #475569',
            color: sleepOption !== null ? 'var(--accent-gold, #EF9F27)' : '#94a3b8',
            padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: 'transparent',
            fontFamily: "'Montserrat', sans-serif", flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          {sleepShort(sleepOption)}
        </button>
      </div>
    </div>
  )
}
