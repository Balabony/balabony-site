'use client'

import { useEffect, useRef } from 'react'
import { getSessionId } from '@/lib/analytics'

/**
 * Облік прочитань твору автора — те, що бачить автор у себе в кабінеті.
 *
 * Кабінет читає вигляд author_story_stats, який бере:
 *   Перегляди   ← content.views_count, а той росте від story_event 'open'
 *   Прочитань   ← article_reads (усі рядки)
 *   Дочитування ← article_reads.completed / read_percentage
 * Досі жодного з трьох джерел на сторінці твору не було, тому в кабінеті
 * стояли нулі. Цей компонент наповнює всі три.
 *
 * Чому не як ReadTracker для серій: там подія шлеться одразу при відкритті
 * сторінки. Для балів читача цього досить, для ВИНАГОРОДИ АВТОРА — ні:
 * цифру, зібрану з відкриттів, автор має право оскаржити, і буде правий.
 *
 * Тому «прочитано» вимагає двох умов разом:
 *   1) кінець тексту побував у полі зору (людина долистала);
 *   2) минуло достатньо АКТИВНОГО часу — 35% від очікуваного часу читання,
 *      але не менше 20 с і не більше 3 хв.
 *
 * Час рахується лише коли вкладка видима: відкрита й забута вкладка
 * прочитанням не стає. Разом умови відсікають і «пролетів вниз за секунду»,
 * і «відкрив та пішов».
 */

const TICK_MS      = 1000
const MIN_DWELL_MS = 20_000
const MAX_DWELL_MS = 180_000
const DWELL_SHARE  = 0.35

export default function StoryReadTracker({
  contentId,
  slug,
  title,
  readMinutes,
}: {
  contentId:   string
  slug:        string
  title:       string
  readMinutes: number
}) {
  const sentinelRef   = useRef<HTMLDivElement | null>(null)
  const sentRef       = useRef(false)
  const reachedEndRef = useRef(false)
  const activeMsRef   = useRef(0)

  // «Відкрив» — одразу, двома подіями: у article_reads (рядок) і в
  // story_events (звідки перераховується content.views_count).
  useEffect(() => {
    if (!contentId) return

    fetch('/api/story-read', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contentId, slug, title, event: 'open' }),
    }).catch(() => {})

    fetch('/api/analytics/track', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type:        'story_event',
        story_id:    contentId,
        story_title: title,
        event_type:  'open',
        session_id:  getSessionId(),
      }),
    }).catch(() => {})
  }, [contentId, slug, title])

  useEffect(() => {
    if (!contentId) return

    const needMs = Math.min(
      MAX_DWELL_MS,
      Math.max(MIN_DWELL_MS, Math.round(readMinutes * 60_000 * DWELL_SHARE)),
    )

    const send = () => {
      if (sentRef.current) return
      sentRef.current = true
      const seconds = Math.round(activeMsRef.current / 1000)

      // keepalive: подія доходить, навіть якщо вкладку вже закривають.
      fetch('/api/story-read', {
        method:    'POST',
        headers:   { 'Content-Type': 'application/json' },
        keepalive: true,
        body:      JSON.stringify({
          contentId,
          slug,
          title,
          event:        'read',
          dwellSeconds: seconds,
        }),
      }).catch(() => {})

      fetch('/api/analytics/track', {
        method:    'POST',
        headers:   { 'Content-Type': 'application/json' },
        keepalive: true,
        body:      JSON.stringify({
          type:             'story_event',
          story_id:         contentId,
          story_title:      title,
          event_type:       'read',
          duration_seconds: seconds,
          session_id:       getSessionId(),
        }),
      }).catch(() => {})
    }

    const maybeSend = () => {
      if (reachedEndRef.current && activeMsRef.current >= needMs) send()
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        activeMsRef.current += TICK_MS
        maybeSend()
      }
    }, TICK_MS)

    let observer: IntersectionObserver | null = null
    const node = sentinelRef.current
    if (node && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        entries => {
          if (entries.some(e => e.isIntersecting)) {
            reachedEndRef.current = true
            maybeSend()
          }
        },
        { rootMargin: '0px 0px -10% 0px' },
      )
      observer.observe(node)
    }

    return () => {
      window.clearInterval(timer)
      observer?.disconnect()
    }
  }, [contentId, slug, title, readMinutes])

  // Маркер кінця тексту. Стоїть одразу під статтею.
  return <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
}
