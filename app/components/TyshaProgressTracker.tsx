'use client'

import { useEffect, useRef } from 'react'
import { getSessionId } from '@/lib/analytics'

/**
 * Інструментування доходимості читалки Тиші.
 * Шле story_events через /api/analytics/track:
 *   read_start              — текст відкрито (читалка змонтувалась)
 *   read_25 / read_50 / 75  — віхи скролу (по разу) — лише для розблокованих серій
 *   read_complete           — доскролив до кінця (≥98%)            — лише для розблокованих
 *   read_next               — клік на «наступна серія» (бінж)       — sendBeacon (йде навігація)
 *   read (+duration_seconds)— час на сторінці на unload             — лише для розблокованих
 *
 * Для locked-серій (тізер пейвола) шлемо ЛИШЕ read_start = перегляд пейвола.
 * Прогрес/завершення/тривалість там не вимірюємо — текст обрізаний, було б брехнею.
 */
export default function TyshaProgressTracker({
  storyId,
  storyTitle,
  locked,
}: {
  storyId: string
  storyTitle: string
  locked: boolean
}) {
  const startedAt = useRef<number>(Date.now())
  const firedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const sid = getSessionId()
    const fired = firedRef.current

    // POST через fetch (сторінка жива)
    const post = (eventType: string, durationSeconds?: number) => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          type: 'story_event',
          story_id: storyId,
          story_title: storyTitle,
          event_type: eventType,
          duration_seconds: durationSeconds ?? null,
          session_id: sid,
        }),
      }).catch(() => {})
    }

    // Маяк на unload/навігацію (надійніше за fetch при закритті)
    const beacon = (eventType: string, durationSeconds?: number) => {
      try {
        const blob = new Blob(
          [JSON.stringify({
            type: 'story_event',
            story_id: storyId,
            story_title: storyTitle,
            event_type: eventType,
            duration_seconds: durationSeconds ?? null,
            session_id: sid,
          })],
          { type: 'application/json' },
        )
        navigator.sendBeacon('/api/analytics/track', blob)
      } catch { /* ignore */ }
    }

    const fireOnce = (key: string, sender: () => void) => {
      if (fired.has(key)) return
      fired.add(key)
      sender()
    }

    // 1) старт читання — завжди (для locked = перегляд пейвола)
    fireOnce('read_start', () => post('read_start'))

    // Прогрес/завершення — лише для розблокованих серій
    let detachScroll = () => {}
    if (!locked) {
      let ticking = false

      const measure = () => {
        ticking = false
        const docEl = document.documentElement
        const scrollable = docEl.scrollHeight - window.innerHeight
        // Якщо нема що скролити (короткий текст на екран) — віхи не рахуємо,
        // щоб не зарахувати «завершення» без реального читання.
        if (scrollable < window.innerHeight * 0.5) return
        const pct = (window.scrollY / scrollable) * 100

        if (pct >= 25) fireOnce('read_25', () => post('read_25'))
        if (pct >= 50) fireOnce('read_50', () => post('read_50'))
        if (pct >= 75) fireOnce('read_75', () => post('read_75'))
        if (pct >= 98) fireOnce('read_complete', () => post('read_complete'))
      }

      const onScroll = () => {
        if (ticking) return
        ticking = true
        requestAnimationFrame(measure)
      }

      window.addEventListener('scroll', onScroll, { passive: true })
      measure() // початковий замір (раптом контент коротший за екран)
      detachScroll = () => window.removeEventListener('scroll', onScroll)
    }

    // 2) бінж: клік на «наступну серію» (id проставлено в page.tsx)
    const nextLink = document.getElementById('tysha-next-link')
    const onNextClick = () => fireOnce('read_next', () => beacon('read_next'))
    if (nextLink) nextLink.addEventListener('click', onNextClick)

    // 3) тривалість читання на unload — лише для розблокованих
    const onLeave = () => {
      if (locked) return
      if (fired.has('read_duration')) return
      fired.add('read_duration')
      const secs = Math.round((Date.now() - startedAt.current) / 1000)
      if (secs >= 3) beacon('read', secs) // ‹read›+duration живить avg_read_duration дашборда
    }
    window.addEventListener('pagehide', onLeave)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onLeave()
    })

    return () => {
      detachScroll()
      if (nextLink) nextLink.removeEventListener('click', onNextClick)
      window.removeEventListener('pagehide', onLeave)
    }
  }, [storyId, storyTitle, locked])

  return null
}
