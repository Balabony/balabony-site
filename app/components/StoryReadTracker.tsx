'use client'

import { useEffect, useRef, useState } from 'react'
import { getSessionId } from '@/lib/analytics'

/**
 * Облік прочитань твору — база для винагороди автора.
 *
 * Умови взято дослівно з договору, п. 1.5: прочитання — це перегляд не менш
 * як 70% ОБСЯГУ тексту одним користувачем, не частіше разу на добу, і не
 * зараховується, якщо час перегляду менший за 15 секунд на кожні 1000 знаків.
 *
 * Раніше тут мірявся лише час (35% від очікуваного, стеля 3 хвилини), і довгий
 * твір зараховувався за три хвилини, хоч би скільки читач насправді подолав.
 * Автор мав повне право таку цифру оскаржити. Тепер міряємо саме те, що
 * записано в договорі, — інакше опублікована формула розходиться з дійсністю.
 *
 * Як міряється обсяг: стежимо, наскільки глибоко нижній край екрана зайшов
 * у текст. Це чесніше за «долистав до кінця»: кінець сторінки можна побачити,
 * пролетівши все, а 70% обсягу разом із мінімальним часом — уже ні.
 *
 * Час рахується лише коли вкладка видима: відкрита й забута вкладка
 * прочитанням не стає.
 */

const TICK_MS = 1000

/** Частка обсягу, за якої твір вважається прочитаним (договір, п. 1.5). */
const NEEDED_SHARE = 0.7

/** Секунд на кожні 1000 знаків (договір, п. 1.5). */
const SECONDS_PER_1000_CHARS = 15

/** Найменший поріг часу — щоб зовсім короткий текст не зараховувався миттєво. */
const MIN_DWELL_MS = 15_000

export default function StoryReadTracker({
  contentId,
  slug,
  title,
  charCount,
}: {
  contentId: string
  slug:      string
  title:     string
  /** Скільки знаків у тексті твору — з цього рахується мінімальний час. */
  charCount: number
}) {
  const sentinelRef  = useRef<HTMLDivElement | null>(null)
  const sentRef      = useRef(false)
  const maxShareRef  = useRef(0)
  const activeMsRef  = useRef(0)

  // Режим перевірки: /stories/щось?readcheck=1 показує лічильник на екрані.
  // Потрібен, щоб бачити, чому прочитання не зарахувалось, — інакше
  // доводиться гадати між «мало часу» і «не знайшло тексту».
  const [check, setCheck] = useState<null | { share: number; sec: number; need: number; sent: boolean }>(null)

  // «Відкрив» — одразу, двома подіями: рядок у article_reads і подія
  // в story_events, з якої перераховується лічильник переглядів.
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

    // Мінімальний час за договором, але не менший за нижню межу.
    const needMs = Math.max(
      MIN_DWELL_MS,
      Math.round((charCount / 1000) * SECONDS_PER_1000_CHARS * 1000),
    )

    /** Стаття — найближчий <article> над маркером. */
    const findBody = (): HTMLElement | null => {
      const node = sentinelRef.current
      if (!node) return null
      let prev = node.previousElementSibling
      while (prev) {
        const found = prev.tagName === 'ARTICLE' ? prev : prev.querySelector('article')
        if (found instanceof HTMLElement) return found
        prev = prev.previousElementSibling
      }
      return document.querySelector('article')
    }

    /**
     * Яка частка тексту побувала на екрані. Рахуємо від того, наскільки низько
     * опустився нижній край вікна відносно початку статті.
     */
    const currentShare = (): number => {
      const body = findBody()
      if (!body) return 0
      const rect = body.getBoundingClientRect()
      const height = rect.height
      if (height <= 0) return 0
      const seen = window.innerHeight - rect.top
      return Math.max(0, Math.min(1, seen / height))
    }

    const send = () => {
      if (sentRef.current) return
      sentRef.current = true
      const seconds = Math.round(activeMsRef.current / 1000)
      const percent = Math.round(maxShareRef.current * 100)

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
          percent,
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

    const debugOn =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('readcheck') === '1'

    const maybeSend = () => {
      if (maxShareRef.current >= NEEDED_SHARE && activeMsRef.current >= needMs) send()
      if (debugOn) {
        setCheck({
          share: Math.round(maxShareRef.current * 100),
          sec:   Math.round(activeMsRef.current / 1000),
          need:  Math.round(needMs / 1000),
          sent:  sentRef.current,
        })
      }
    }

    const onScroll = () => {
      const share = currentShare()
      if (share > maxShareRef.current) maxShareRef.current = share
      maybeSend()
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        activeMsRef.current += TICK_MS
        maybeSend()
      }
    }, TICK_MS)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    onScroll()   // короткий твір може вміститися на екран одразу

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [contentId, slug, title, charCount])

  // Маркер стоїть одразу під статтею — від нього шукаємо текст для вимірювання.
  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
      {check && (
        <div style={{
          position: 'fixed', left: 12, bottom: 12, zIndex: 9999,
          background: 'rgba(10,22,40,0.94)', color: '#f5f0e8',
          border: '1px solid rgba(239,159,39,0.6)', borderRadius: 10,
          padding: '10px 12px', fontSize: 13, lineHeight: 1.5,
          fontFamily: "'Montserrat', Arial, sans-serif", pointerEvents: 'none',
        }}>
          <div>Прочитано обсягу: <b style={{ color: check.share >= 70 ? '#7ddba0' : '#ef9f27' }}>{check.share}%</b> із 70%</div>
          <div>Час на сторінці: <b style={{ color: check.sec >= check.need ? '#7ddba0' : '#ef9f27' }}>{check.sec} с</b> із {check.need} с</div>
          <div style={{ marginTop: 4, color: check.sent ? '#7ddba0' : '#b9c6db' }}>
            {check.sent ? 'зараховано' : 'ще не зараховано'}
          </div>
        </div>
      )}
    </>
  )
}
