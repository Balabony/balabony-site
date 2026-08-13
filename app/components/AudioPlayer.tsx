'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { trackStoryEvent } from '@/lib/analytics'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
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
  /**
   * Ключ, під яким зберігається місце зупинки в `listening_progress`.
   * Якщо не передано — беремо contentId, далі title. Аби ключ був стабільний:
   * назви змінюються, тож slug або uuid надійніші.
   */
  slug?: string | null
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0]

// Скільки секунд гасне звук перед зупинкою за таймером сну.
const FADE_SEC = 20

// Кнопки перемотування: 44 px — мінімум, за який палець упевнено влучає.
const SKIP_BTN_STYLE: React.CSSProperties = {
  width: 40, height: 40, flexShrink: 0,
  background: 'transparent', border: '1px solid #475569', borderRadius: '50%',
  color: '#94a3b8', cursor: 'pointer',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  fontSize: 15, lineHeight: 1, fontFamily: "'Montserrat', sans-serif",
}

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

export default function AudioPlayer({ audioUrl, audioStatus, title, contentId, slug }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(0)
  const [sleepIdx, setSleepIdx] = useState(SLEEP_OPTIONS.length - 1) // старт = null (вимк.)
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const openTracked = useRef(false)
  const readTracked = useRef(false)

  const ready = audioStatus === 'ready' && !!audioUrl

  // ── МІСЦЕ ЗУПИНКИ ─────────────────────────────────────────────────────────
  // Слухають уривками: у дорозі, між справами, перед сном. Без цього людина
  // щоразу починає епізод спочатку. Позицію тримаємо в listening_progress
  // (ключ user_id + progressKey), пишемо не частіше разу на 10 секунд.
  const progressKey = slug || contentId || title || null
  const [resumeAt, setResumeAt] = useState<number | null>(null)
  const userIdRef = useRef<string | null>(null)
  const lastSavedRef = useRef(0)
  const currentRef = useRef(0)
  const durationRef = useRef(0)

  useEffect(() => { currentRef.current = current }, [current])
  useEffect(() => { durationRef.current = duration }, [duration])

  const saveProgress = useCallback(async (force = false) => {
    const uid = userIdRef.current
    const pos = currentRef.current
    if (!uid || !progressKey || !pos) return
    if (!force && Math.abs(pos - lastSavedRef.current) < 10) return
    lastSavedRef.current = pos
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.from('listening_progress').upsert({
        user_id: uid,
        slug: progressKey,
        position_sec: Math.round(pos),
        duration_sec: durationRef.current ? Math.round(durationRef.current) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,slug' })
    } catch {
      // Місце зупинки — зручність, а не критична функція: мовчки пропускаємо.
    }
  }, [progressKey])

  // Хто слухає і де зупинився минулого разу.
  useEffect(() => {
    if (!ready || !progressKey) return
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: auth } = await supabase.auth.getUser()
        const uid = auth?.user?.id ?? null
        if (cancelled) return
        userIdRef.current = uid
        if (!uid) return
        const { data } = await supabase
          .from('listening_progress')
          .select('position_sec, duration_sec')
          .eq('user_id', uid)
          .eq('slug', progressKey)
          .maybeSingle()
        if (cancelled || !data) return
        const pos = Number(data.position_sec) || 0
        const dur = Number(data.duration_sec) || 0
        // Не пропонуємо продовжити з самого початку і з майже кінця.
        if (pos > 15 && (!dur || pos < dur - 15)) setResumeAt(pos)
      } catch {
        // мовчки
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, progressKey])

  // Періодичний запис під час програвання + запис при виході зі сторінки.
  useEffect(() => {
    if (!playing) { void saveProgress(true); return }
    const id = setInterval(() => { void saveProgress() }, 10000)
    return () => clearInterval(id)
  }, [playing, saveProgress])

  useEffect(() => {
    const onLeave = () => { void saveProgress(true) }
    window.addEventListener('pagehide', onLeave)
    return () => {
      window.removeEventListener('pagehide', onLeave)
      void saveProgress(true)
    }
  }, [saveProgress])

  const jumpToResume = () => {
    const a = audioRef.current
    if (!a || resumeAt === null) return
    a.currentTime = resumeAt
    setCurrent(resumeAt)
    setResumeAt(null)
    void a.play()
  }

  const sleepOption = SLEEP_OPTIONS[sleepIdx]

  // Скидаємо стан, якщо змінилося джерело аудіо.
  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
    openTracked.current = false
    readTracked.current = false
    setResumeAt(null)
    lastSavedRef.current = 0
  }, [audioUrl])

  // Тримаємо швидкість синхронною з реальним елементом.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[speedIdx]
  }, [speedIdx, ready])

  // Sleep timer: для хвилинних опцій ставимо таймаут на паузу.
  // Опція 'end' обробляється через onEnded аудіо, тут таймаут не потрібен.
  // Таймер відлічується лише поки реально грає; на паузі — зупиняється.
  //
  // Останні FADE_SEC секунд гучність плавно спадає до нуля. Різкий обрив
  // будить того, хто вже засинає, — а таймером сну користуються саме для сну.
  // Після паузи гучність повертаємо на 1, інакше наступний запуск буде німим.
  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current)
      sleepTimerRef.current = null
    }
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }
    if (!playing) return
    if (typeof sleepOption !== 'number') return // null або 'end' — без таймауту

    const totalMs = sleepOption * 60 * 1000
    const fadeMs = Math.min(FADE_SEC * 1000, totalMs / 2)

    // Крок 1: за fadeMs до кінця починаємо гасити звук.
    const fadeStart = setTimeout(() => {
      const a = audioRef.current
      if (!a) return
      const steps = FADE_SEC * 4 // чотири кроки на секунду — на слух безперервно
      let done = 0
      const startVolume = a.volume
      fadeIntervalRef.current = setInterval(() => {
        done += 1
        const left = Math.max(0, 1 - done / steps)
        if (audioRef.current) audioRef.current.volume = startVolume * left
        if (done >= steps && fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
      }, fadeMs / steps)
    }, totalMs - fadeMs)

    // Крок 2: власне зупинка і повернення гучності.
    sleepTimerRef.current = setTimeout(() => {
      const a = audioRef.current
      if (a) {
        a.pause()
        a.volume = 1
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }
      setSleepIdx(SLEEP_OPTIONS.length - 1) // скинути на «вимк.» після спрацювання
    }, totalMs)

    return () => {
      clearTimeout(fadeStart)
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current)
        sleepTimerRef.current = null
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }
      // Скасували таймер або натиснули паузу — звук має бути повним.
      if (audioRef.current) audioRef.current.volume = 1
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

  // ── ТРИВАЛІСТЬ ФАЙЛІВ БЕЗ ЗАГОЛОВКА ───────────────────────────────────────
  // mp3 зі змінним бітрейтом і без Xing/VBRI-заголовка не повідомляє довжину:
  // браузер віддає 0 або Infinity, і смужка прогресу стоїть, а перемотування
  // вперед не має верхньої межі. Такі файли дає більшість TTS-конвеєрів.
  // Обхід відомий: перемотати у завідомо недосяжну точку — браузер дочитує
  // структуру файлу й повертає справжню тривалість, після чого вертаємось на 0.
  const probedRef = useRef(false)

  const readDuration = (a: HTMLAudioElement) => {
    const d = a.duration
    if (isFinite(d) && d > 0) {
      setDuration(d)
      return true
    }
    return false
  }

  const probeDuration = (a: HTMLAudioElement) => {
    if (probedRef.current) return
    probedRef.current = true
    const wasTime = a.currentTime
    const onUpdate = () => {
      if (readDuration(a)) {
        a.removeEventListener('durationchange', onUpdate)
        try { a.currentTime = wasTime } catch { /* ігноруємо */ }
      }
    }
    a.addEventListener('durationchange', onUpdate)
    try {
      a.currentTime = 1e101
    } catch {
      a.removeEventListener('durationchange', onUpdate)
    }
  }

  // Перемотування на задану кількість секунд: назад — коли прослухав неуважно,
  // вперед — щоб проскочити довгий вступ.
  const skipBy = (sec: number) => {
    const a = audioRef.current
    if (!a) return
    const limit = duration || a.duration || 0
    const next = a.currentTime + sec
    a.currentTime = Math.max(0, limit ? Math.min(next, limit) : next)
    setCurrent(a.currentTime)
  }

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
        onLoadedMetadata={(e) => {
          const a = e.currentTarget
          if (!readDuration(a)) probeDuration(a)
        }}
        onDurationChange={(e) => { readDuration(e.currentTarget) }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={(e) => {
          // Якщо файл так і не повідомив тривалість, беремо її з точки завершення.
          if (!duration) {
            const d = e.currentTarget.currentTime
            if (d > 0) setDuration(d)
          }
          setPlaying(false)
          setSleepIdx(SLEEP_OPTIONS.length - 1) // епізод завершився — таймер сну скинути
          if (!readTracked.current && title) {
            readTracked.current = true
            trackStoryEvent(contentId ?? title, title, 'read', Math.round(duration))
          }
        }}
      />

      {/* Місце зупинки з минулого разу. Не перемотуємо самі — пропонуємо. */}
      {resumeAt !== null && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 4%', background: 'rgba(239,159,39,0.14)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontSize: 14,
          }}
        >
          <span style={{ flex: 1 }}>
            Ви зупинилися на {fmt(resumeAt)}
          </span>
          <button
            onClick={jumpToResume}
            style={{
              background: 'var(--accent-gold, #EF9F27)', color: '#0E1A2B',
              border: 'none', borderRadius: 6, padding: '6px 14px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Продовжити
          </button>
          <button
            onClick={() => setResumeAt(null)}
            aria-label="Слухати спочатку"
            style={{
              background: 'transparent', color: '#fff', opacity: 0.7,
              border: 'none', fontSize: 18, lineHeight: 1,
              cursor: 'pointer', padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
      )}

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
        {/* Назад на 15 с. З клавіатури перемотування є давно, але слухають
            переважно з телефона, де стрілок немає. */}
        <button
          onClick={() => skipBy(-15)}
          aria-label="Назад на 15 секунд"
          style={SKIP_BTN_STYLE}
        >
          <span aria-hidden="true">↺</span>
          <span style={{ fontSize: 9, fontWeight: 700, marginTop: -2 }}>15</span>
        </button>

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

        {/* Вперед на 30 с */}
        <button
          onClick={() => skipBy(30)}
          aria-label="Вперед на 30 секунд"
          style={SKIP_BTN_STYLE}
        >
          <span aria-hidden="true">↻</span>
          <span style={{ fontSize: 9, fontWeight: 700, marginTop: -2 }}>30</span>
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
