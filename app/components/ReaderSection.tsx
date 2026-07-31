'use client'

import { useState, useEffect, useRef } from 'react'
import { countWords } from '@/lib/readingTime'

const SEASONS = [1, 2, 3, 4, 5]
const EPISODES_PER_SEASON = 20
const TOTAL_EPISODES = SEASONS.length * EPISODES_PER_SEASON

const STORAGE_KEY_FREE = 'balabony-free-episode'
const STORAGE_KEY_BOOKMARKS = 'balabony-bookmarks'
const STORAGE_KEY_PROGRESS = 'balabony-progress'
const STORAGE_KEY_READ = 'balabony-read'
const STORAGE_KEY_THEME = 'balabony-theme'

type EpisodeData = {
  title: string
  content: string
  locked: boolean
  duration_minutes: number | null
  url: string | null
}

type Theme = 'dark' | 'light' | 'amber'
type FontStyle = 'serif' | 'sans' | 'dyslexic'

export default function ReaderSection() {
  const [fontSize, setFontSize] = useState(24)
  const [fontStyle, setFontStyle] = useState<FontStyle>('serif')
  const [zenMode, setZenMode] = useState(false)
  const [currentSeason, setCurrentSeason] = useState(1)
  const [currentEp, setCurrentEp] = useState(1)
  const [freeEpisode, setFreeEpisode] = useState<number | null>(null)
  const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set())
  const [readEpisodes, setReadEpisodes] = useState<Set<number>>(new Set())
  const [unlockedEpisodes, setUnlockedEpisodes] = useState<Set<number>>(new Set())
  const [theme, setTheme] = useState<Theme>('dark')

  const readerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollRestoredRef = useRef(false)

  // Load all persisted state on mount
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FREE)
      if (saved) {
        const num = parseInt(saved, 10)
        if (!isNaN(num)) setFreeEpisode(num)
      }
      const bks = localStorage.getItem(STORAGE_KEY_BOOKMARKS)
      if (bks) {
        const parsed = JSON.parse(bks)
        if (Array.isArray(parsed)) setBookmarks(new Set(parsed.filter((n: unknown) => typeof n === 'number')))
      }
      const reads = localStorage.getItem(STORAGE_KEY_READ)
      if (reads) {
        const parsed = JSON.parse(reads)
        if (Array.isArray(parsed)) setReadEpisodes(new Set(parsed.filter((n: unknown) => typeof n === 'number')))
      }
      const th = localStorage.getItem(STORAGE_KEY_THEME)
      if (th === 'dark' || th === 'light' || th === 'amber') setTheme(th)
    } catch {
      // ignore localStorage errors
    }
  }, [])

  // Load anonymous user picks from /api/pick on mount.
  // Server returns globalEp values for series the user has already picked.
  // We populate unlockedEpisodes so paywall stays in sync with the DB.
  useEffect(() => {
    let cancelled = false
    fetch('/api/pick')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.ok) return
        const seriesPicks = data?.picks?.series
        if (!Array.isArray(seriesPicks)) return
        const ids = seriesPicks
          .map((p: { globalEp?: unknown }) =>
            typeof p?.globalEp === 'number' ? p.globalEp : null)
          .filter((n: number | null): n is number => n !== null)
        setUnlockedEpisodes(new Set(ids))
      })
      .catch(() => {
        // Silent fail — paywall treats all non-DB-free episodes as locked,
        // which is the safe default. User can retry by clicking an episode.
      })
    return () => { cancelled = true }
  }, [])

  // Apply theme by toggling body class
  useEffect(() => {
    if (!mounted) return
    const body = document.body
    body.classList.remove('dark-mode', 'amber-mode')
    if (theme === 'dark') body.classList.add('dark-mode')
    if (theme === 'amber') body.classList.add('amber-mode')
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme)
    } catch {}
  }, [theme, mounted])

  // Track native fullscreen state
  useEffect(() => {
    const onFsChange = () => setZenMode(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleZen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (readerRef.current?.requestFullscreen) await readerRef.current.requestFullscreen()
      } else {
        if (document.exitFullscreen) await document.exitFullscreen()
      }
    } catch {}
  }

  // Fetch episode whenever ep/season/free changes
  useEffect(() => {
    if (!mounted) return
    const globalEp = (currentSeason - 1) * EPISODES_PER_SEASON + currentEp
    const params = new URLSearchParams({
      season: String(currentSeason),
      episode: String(globalEp),
      preview: '1',
    })

    setLoading(true)
    setError(null)
    scrollRestoredRef.current = false
    fetch(`/api/episode?${params.toString()}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: EpisodeData) => {
        setEpisodeData(data)
        setLoading(false)
      })
      .catch(e => {
        setError(e?.message ?? 'Failed to load episode')
        setLoading(false)
      })
  }, [currentSeason, currentEp, mounted])

  // Restore scroll position after content renders
  const globalCurrentEp = (currentSeason - 1) * EPISODES_PER_SEASON + currentEp
  useEffect(() => {
    if (loading || !episodeData || !contentRef.current || scrollRestoredRef.current) return
    try {
      const map = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS) || '{}')
      const y = map[globalCurrentEp]
      if (typeof y === 'number' && y > 0 && contentRef.current) {
        // Scroll to absolute Y position within the content area
        const rect = contentRef.current.getBoundingClientRect()
        const absoluteTop = window.scrollY + rect.top
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({
          top: absoluteTop + y,
          behavior: prefersReduced ? 'auto' : 'smooth',
        })
      }
    } catch {}
    scrollRestoredRef.current = true
  }, [loading, episodeData, globalCurrentEp])

  // Save scroll progress while reading (relative to content top), and mark read
  useEffect(() => {
    if (!mounted) return
    let timeout: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        const el = contentRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const contentTop = window.scrollY + rect.top
        const relative = Math.max(0, window.scrollY - contentTop)
        const contentHeight = el.offsetHeight
        try {
          const map = JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS) || '{}')
          map[globalCurrentEp] = relative
          localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(map))
          if (contentHeight > 0 && relative / contentHeight > 0.7) {
            setReadEpisodes(prev => {
              if (prev.has(globalCurrentEp)) return prev
              const next = new Set(prev)
              next.add(globalCurrentEp)
              try {
                localStorage.setItem(STORAGE_KEY_READ, JSON.stringify(Array.from(next)))
              } catch {}
              return next
            })
          }
        } catch {}
      }, 200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timeout) clearTimeout(timeout)
    }
  }, [globalCurrentEp, mounted])

  // Handle episode pick.
  // - Always navigates to the episode (setCurrentEp).
  // - Always tries to register the pick on the server (POST /api/pick).
  // - Legacy localStorage write retained as a fallback (A1).
  // - On limit-reached or network error: silent (paywall preview handles UX).
  const handlePickEpisode = (ep: number) => {
    const globalEp = (currentSeason - 1) * EPISODES_PER_SEASON + ep
    setCurrentEp(ep)

    // Legacy localStorage write (A1 — backward-compatible fallback)
    if (freeEpisode === null) {
      try { localStorage.setItem(STORAGE_KEY_FREE, String(globalEp)) } catch {}
      setFreeEpisode(globalEp)
    }

    // If already unlocked, no need to POST again
    if (unlockedEpisodes.has(globalEp)) return

    // Register pick on the server (idempotent, server enforces season limit)
    fetch('/api/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: 'series',
        season: currentSeason,
        contentId: globalEp,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data?.ok && data?.picked) {
          setUnlockedEpisodes(prev => {
            const next = new Set(prev)
            next.add(globalEp)
            return next
          })
        }
        // If data.ok === false (e.g. season_limit_reached): do nothing.
        // /api/episode will return locked: true and paywall preview renders.
      })
      .catch(err => {
        console.warn('[handlePickEpisode] /api/pick failed:', err)
      })
  }

  const toggleBookmark = (globalEp: number) => {
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(globalEp)) next.delete(globalEp)
      else next.add(globalEp)
      try {
        localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
  }

  const goToNextEpisode = () => {
    if (globalCurrentEp >= TOTAL_EPISODES) return
    const nextGlobal = globalCurrentEp + 1
    const nextSeason = Math.ceil(nextGlobal / EPISODES_PER_SEASON)
    const nextEp = ((nextGlobal - 1) % EPISODES_PER_SEASON) + 1
    setCurrentSeason(nextSeason)
    setCurrentEp(nextEp)
  }

  const cycleTheme = () => {
    setTheme(t => (t === 'dark' ? 'light' : t === 'light' ? 'amber' : 'dark'))
  }

  // Quote selection + share
  const [selectedQuote, setSelectedQuote] = useState<string>('')
  const [quoteBoxPos, setQuoteBoxPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!mounted) return
    const onSelChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setSelectedQuote('')
        setQuoteBoxPos(null)
        return
      }
      const text = sel.toString().trim()
      // Only react when selection is inside the content area
      const container = contentRef.current
      if (!container || text.length < 10) {
        setSelectedQuote('')
        setQuoteBoxPos(null)
        return
      }
      const range = sel.getRangeAt(0)
      const node = range.commonAncestorContainer
      const inside = container.contains(node.nodeType === 1 ? (node as Element) : node.parentElement)
      if (!inside) {
        setSelectedQuote('')
        setQuoteBoxPos(null)
        return
      }
      const rect = range.getBoundingClientRect()
      setSelectedQuote(text)
      setQuoteBoxPos({
        top: rect.top + window.scrollY - 48,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    }
    document.addEventListener('selectionchange', onSelChange)
    return () => document.removeEventListener('selectionchange', onSelChange)
  }, [mounted])

  const shareQuote = async () => {
    if (!selectedQuote || !episodeData) return
    const url = typeof window !== 'undefined' ? window.location.origin : ''
    const text = `«${selectedQuote}»\n\n— ${episodeData.title}, Балабони, серія ${globalCurrentEp}\n${url}`
    try {
      if (navigator.share) {
        await navigator.share({ text, url })
      } else {
        await navigator.clipboard.writeText(text)
        alert('Цитату скопійовано в буфер обміну')
      }
    } catch {
      // user cancelled or error
    }
    setSelectedQuote('')
    setQuoteBoxPos(null)
    window.getSelection()?.removeAllRanges()
  }

  const cycleFontStyle = () => {
    setFontStyle(f => (f === 'serif' ? 'sans' : f === 'sans' ? 'dyslexic' : 'serif'))
  }

  const getFontFamily = () => {
    if (fontStyle === 'serif') return "'Lora', serif"
    if (fontStyle === 'sans') return "'Montserrat', sans-serif"
    return "'OpenDyslexic', 'Comic Sans MS', sans-serif"
  }

  const fontStyleLabel =
    fontStyle === 'serif'
      ? 'З зарубками (Книжковий)'
      : fontStyle === 'sans'
      ? 'Без зарубок (Сучасний)'
      : 'Для дислексії'

  const isLocked = episodeData?.locked === true
  const isBookmarked = bookmarks.has(globalCurrentEp)
  const readCount = readEpisodes.size

  const scrollToPricing = () => {
    const el = document.getElementById('pricing')
    if (!el) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' })
  }

  // Split content into paragraphs
  const paragraphs = (episodeData?.content ?? '')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
  const finalParagraphs =
    paragraphs.length > 1
      ? paragraphs
      : (episodeData?.content ?? '')
          .split(/\n+/)
          .map(p => p.trim())
          .filter(Boolean)

  // На головній API завжди віддає короткий прев'ю (preview=1), тож кнопку
  // «Читати далі» показуємо, коли є посилання на повну сторінку серії.
  const isTeaser = !!episodeData?.url

  const themeLabel = theme === 'dark' ? 'Темна' : theme === 'light' ? 'Світла' : 'Сепія'

  return (
    <section id="reader" style={{ marginBottom: 28 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Dyslexic:wght@400;700&display=swap');
        #reader button:focus-visible {
          outline: 2px solid var(--accent-gold);
          outline-offset: 2px;
        }
        /* Пара кнопок під тизером: або поруч, або одна під одною — але ніколи рваним текстом */
        .teaser-cta-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: stretch;
        }
        .teaser-cta {
          flex: 1 1 150px;
          min-width: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 52px;
          padding: 0 18px;
          border-radius: 12px;
          font-family: 'Montserrat', sans-serif;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
          text-decoration: none;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
        }
        .teaser-cta__arrow { flex-shrink: 0; font-weight: 400; }
        .teaser-cta--primary {
          background: var(--accent-gold);
          color: var(--on-gold);
          box-shadow: 0 4px 16px rgba(239,159,39,0.32);
        }
        .teaser-cta--ghost {
          background: transparent;
          color: var(--text);
          border-color: var(--border);
          font-weight: 600;
        }
        @media (hover: hover) {
          .teaser-cta--primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,159,39,0.42); }
          .teaser-cta--ghost:hover { border-color: var(--accent-gold); color: var(--accent-gold); }
        }
        .teaser-cta:active { transform: translateY(0); }
        .balabony-quote-fab {
          position: absolute;
          transform: translate(-50%, -100%);
          background: var(--dark, #0f172a);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          z-index: 50;
          box-shadow: 0 6px 24px rgba(0,0,0,0.35);
          font-family: 'Montserrat', sans-serif;
        }
        .balabony-quote-fab::after {
          content: '';
          position: absolute;
          left: 50%; bottom: -6px;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: var(--dark, #0f172a);
          border-bottom: 0;
        }
      `}</style>
      {selectedQuote && quoteBoxPos && (
        <button
          className="balabony-quote-fab"
          onMouseDown={(e) => e.preventDefault()}
          onClick={shareQuote}
          style={{ top: quoteBoxPos.top, left: quoteBoxPos.left }}
        >
          ❝ Поділитись цитатою
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1a2f4a', border: '1.5px solid rgba(239,159,39,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 56 56" fill="none">
            <path d="M14 38 L14 18 Q28 13 28 22 Q28 13 42 18 L42 38 Q28 33 28 41 Q28 33 14 38 Z" stroke="var(--accent-gold)" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
            <line x1="28" y1="22" x2="28" y2="41" stroke="var(--accent-gold)" strokeWidth="1.5" strokeDasharray="3,2.5"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: "'Montserrat', Arial, sans-serif" }}>ЧИТАЙТЕ</div>
          {mounted && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Прочитано: {readCount} з {TOTAL_EPISODES}
            </div>
          )}
        </div>
      </div>

      <div ref={readerRef} style={{ background: 'var(--white)', border: '1.5px solid var(--accent-gold)', borderRadius: 20, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Шрифт:</span>
          {[
            { label: 'A+', action: () => setFontSize(s => Math.min(s + 2, 36)) },
            { label: 'A-', action: () => setFontSize(s => Math.max(s - 2, 14)) },
          ].map(b => (
            <button key={b.label} onClick={b.action} style={{
              padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8,
              cursor: 'pointer', background: 'transparent', color: 'var(--text)',
              fontSize: 16, fontWeight: 600, fontFamily: "'Montserrat', sans-serif", minHeight: 44
            }}>{b.label}</button>
          ))}
          <button onClick={cycleFontStyle} style={{
            padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8,
            cursor: 'pointer', background: fontStyle !== 'sans' ? 'var(--dark)' : 'transparent',
            color: fontStyle !== 'sans' ? '#fff' : 'var(--text)', fontSize: 14, fontWeight: 600,
            fontFamily: "'Montserrat', sans-serif", minHeight: 44
          }}>
            {fontStyleLabel}
          </button>
          <button onClick={cycleTheme} aria-label="Тема" title="Змінити тему" style={{
            padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8,
            cursor: 'pointer', background: 'transparent', color: 'var(--text)',
            fontSize: 13, fontWeight: 600, fontFamily: "'Montserrat', sans-serif", minHeight: 44
          }}>
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🟤'} {themeLabel}
          </button>
          <button onClick={toggleZen} aria-label="Zen-режим (повний екран)" style={{
            padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8,
            cursor: 'pointer', background: 'transparent', color: 'var(--text)', minHeight: 44
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {zenMode
                ? <path d="M5 1v4H1 M1 9h4v4 M13 9v4h-4 M9 5V1h4" />
                : <path d="M1 5V1h4 M9 1h4v4 M13 9v4h-4 M5 13H1v-4" />}
            </svg>
          </button>
          <button
            onClick={() => toggleBookmark(globalCurrentEp)}
            aria-label={isBookmarked ? 'Прибрати закладку' : 'Додати закладку'}
            title={isBookmarked ? 'Прибрати закладку' : 'Додати закладку'}
            style={{
              padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 8,
              cursor: 'pointer',
              background: isBookmarked ? 'var(--accent-gold)' : 'transparent',
              color: isBookmarked ? '#fff' : 'var(--text)',
              minHeight: 44, fontSize: 16
            }}
          >
            {isBookmarked ? '✦' : '✧'}
          </button>
          <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--accent-gold)', color: 'var(--on-gold)', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>Офлайн · скоро</span>
        </div>

        {/* Story title */}
        <div style={{ padding: '20px 28px 0', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 8 }}>
            {episodeData?.title
              ? `Серія ${globalCurrentEp}: ${episodeData.title}`
              : `Серія ${globalCurrentEp}`}
          </div>
          {(() => {
            const w = countWords(episodeData?.content)
            const min = w ? Math.max(1, Math.round(w / 150)) : 0
            return min ? (
              <div style={{ fontSize: 15, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <span aria-hidden="true" style={{ fontSize: 16 }}>⏱</span>
                <span>~{min} хв читання</span>
              </div>
            ) : null
          })()}
        </div>

        {/* Season tabs */}
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SEASONS.map(s => {
            const isActive = s === currentSeason
            return (
              <button
                key={s}
                onClick={() => setCurrentSeason(s)}
                style={{
                  padding: '8px 14px', borderRadius: 8, minHeight: 36,
                  border: `1.5px solid ${isActive ? 'var(--accent-gold)' : 'var(--border)'}`,
                  background: isActive ? 'var(--accent-gold)' : 'transparent',
                  color: isActive ? 'var(--on-gold)' : 'var(--text)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Montserrat', sans-serif"
                }}
              >
                Сезон {s}
              </button>
            )
          })}
        </div>

        {/* Episodes grid */}
        <div style={{ padding: '12px 24px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>
            Сезон {currentSeason}: 20 серій
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: EPISODES_PER_SEASON }, (_, i) => {
              const ep = i + 1
              const globalEp = (currentSeason - 1) * EPISODES_PER_SEASON + ep
              const isActive = ep === currentEp
              const isFree = mounted && unlockedEpisodes.has(globalEp)
              const isBkm = mounted && bookmarks.has(globalEp)
              const isRead = mounted && readEpisodes.has(globalEp)
              return (
                <button
                  key={ep}
                  onClick={() => handlePickEpisode(ep)}
                  style={{
                    position: 'relative',
                    padding: '8px 10px', borderRadius: 8, minWidth: 44, minHeight: 44,
                    border: `1.5px solid ${isActive ? 'var(--accent-gold)' : isFree ? 'var(--accent-gold)' : 'var(--border)'}`,
                    background: isActive ? 'var(--accent-gold)' : isFree ? 'rgba(239,159,39,0.12)' : isRead ? 'rgba(239,159,39,0.05)' : 'var(--white)',
                    color: isActive ? 'var(--on-gold)' : isFree ? '#a05f00' : isRead ? 'var(--text)' : 'var(--muted)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Montserrat', sans-serif"
                  }}
                  title={[
                    isFree ? 'Безкоштовна' : null,
                    isBkm ? 'Закладка' : null,
                    isRead ? 'Прочитано' : null,
                  ].filter(Boolean).join(' · ')}
                >
                  <span>{ep}</span>
                  {isFree && <span style={{ marginLeft: 2 }}>★</span>}
                  {isBkm && (
                    <span style={{
                      position: 'absolute',
                      top: 2, right: 4,
                      fontSize: 10,
                      color: 'var(--accent-gold)',
                      lineHeight: 1
                    }}>✦</span>
                  )}
                  {isRead && !isActive && !isFree && (
                    <span style={{
                      position: 'absolute',
                      bottom: 3, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4, height: 4,
                      borderRadius: '50%',
                      background: 'var(--accent-gold)'
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div>
          <div ref={contentRef} style={{
            position: 'relative',
            padding: isLocked && !loading ? '20px 28px 12px' : '20px 28px 28px',
            fontSize: fontSize,
            lineHeight: 2.0,
            fontFamily: getFontFamily(),
            minHeight: 200
          }}>
            {loading && (
              <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Завантаження…</p>
            )}
            {error && !loading && (
              <p style={{ color: 'var(--muted)' }}>Не вдалося завантажити серію: {error}</p>
            )}
            {!loading && !error && finalParagraphs.map((p, idx) => {
              const dialogueMatch = p.match(/^([А-ЯЇІЄҐ][а-яїієґА-ЯЇІЄҐ'-]*)\s*:\s*([\s\S]*)$/)
              if (dialogueMatch) {
                const speaker = dialogueMatch[1]
                const rest = dialogueMatch[2]
                const parts = rest.split(/(\([^)]*\))/g).filter(Boolean)
                return (
                  <p key={idx} style={{ marginBottom: 18 }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{speaker}:</span>{' '}
                    {parts.map((part, i) =>
                      part.startsWith('(') && part.endsWith(')') ? (
                        <em key={i} style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{part}</em>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </p>
                )
              }
              const parts = p.split(/(\([^)]*\))/g).filter(Boolean)
              const isHeading = idx === 0 && /^Серія\s*№?\s*\d/.test(p)
              return (
                <p key={idx} style={{ marginBottom: isHeading ? 24 : 18, fontWeight: isHeading ? 700 : undefined }}>
                  {parts.map((part, i) =>
                    part.startsWith('(') && part.endsWith(')') ? (
                      <em key={i} style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{part}</em>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </p>
              )
            })}

            {/* Тизер: затухання над текстом + кнопки «Читати далі» і «Серія N» в один рядок */}
            {!loading && !error && !isLocked && isTeaser && (
              <div>
                <div style={{
                  height: 44,
                  marginTop: -44,
                  marginBottom: 16,
                  background: 'linear-gradient(to bottom, transparent, var(--white))',
                  pointerEvents: 'none'
                }} />
                <div className="teaser-cta-row">
                  {episodeData?.url ? (
                    <a href={episodeData.url} className="teaser-cta teaser-cta--primary">
                      <span>Читати далі</span>
                      <span className="teaser-cta__arrow" aria-hidden="true">→</span>
                    </a>
                  ) : null}
                  {globalCurrentEp < TOTAL_EPISODES && (
                    <button onClick={goToNextEpisode} className="teaser-cta teaser-cta--ghost">
                      <span>Серія {globalCurrentEp + 1}</span>
                      <span className="teaser-cta__arrow" aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Наступна серія для повністю відкритого тексту (не тизер) */}
            {!loading && !error && !isLocked && !isTeaser && globalCurrentEp < TOTAL_EPISODES && (
              <div style={{ marginTop: 28, textAlign: 'center' }}>
                <button
                  onClick={goToNextEpisode}
                  className="teaser-cta teaser-cta--ghost"
                  style={{ flex: '0 1 auto', padding: '0 26px' }}
                >
                  <span>Далі: Серія {globalCurrentEp + 1}</span>
                  <span className="teaser-cta__arrow" aria-hidden="true">→</span>
                </button>
              </div>
            )}

            {isLocked && !loading && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 120,
                background: 'linear-gradient(to bottom, transparent, var(--white))',
                pointerEvents: 'none'
              }} />
            )}
          </div>

          {/* Paywall message */}
          {isLocked && !loading && (
            <div style={{
              padding: '8px 28px 28px',
              textAlign: 'center',
              background: 'var(--white)'
            }}>
              <p style={{ fontSize: 15, color: 'var(--text)', marginBottom: 14, lineHeight: 1.5 }}>
                {freeEpisode !== null ? (
                  <>Це була твоя безкоштовна серія. Щоб читати далі&nbsp;— обери&nbsp;пакет.</>
                ) : (
                  <>Щоб читати далі&nbsp;— обери&nbsp;пакет.</>
                )}
              </p>
              <button
                onClick={scrollToPricing}
                style={{
                  padding: '12px 24px',
                  background: 'var(--accent-gold)',
                  color: 'var(--on-gold)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Montserrat', sans-serif"
                }}
              >
                Обрати пакет →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
