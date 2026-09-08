'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Позиція читання: зберігає, де людина спинилася, і пропонує повернутися.
 *
 * Досі позиція не зберігалася ніде: сторінки твору й епізоду серверні, а той
 * localStorage-прогрес, що лежав у ReaderSection, нікого не обслуговував —
 * сам компонент у застосунку не використовується. Для серіалу на сто епізодів
 * це найчастіша причина кинути читання.
 *
 * Зберігаємо на сервері (/api/reading-progress), тому для залогінених позиція
 * спільна на телефоні й комп'ютері.
 *
 * Чому плашка з кнопкою, а не автоматичне прокручування: раптовий стрибок
 * сторінки дезорієнтує, особливо людину з екранним читачем або зі слабким
 * зором. Рішення лишається за читачем.
 */

/** Як часто пишемо позицію під час гортання. */
const SAVE_THROTTLE_MS = 1500

/** Нижче цієї частки не пропонуємо продовжити — людина щойно відкрила. */
const MIN_RESUME_SHARE = 0.03

/** Вище цієї частки твір фактично дочитано. */
const MAX_RESUME_SHARE = 0.94

export default function ReadingPosition({
  slug,
  title,
  path,
  contentId,
}: {
  slug: string
  title?: string
  path: string
  contentId?: string
}) {
  const markerRef = useRef<HTMLSpanElement>(null)
  const savedRef = useRef(0)
  const restoredRef = useRef(false)
  const [resumeTo, setResumeTo] = useState<number | null>(null)

  /** Стаття — найближчий <article> над маркером, як у StoryReadTracker. */
  function findArticle(): HTMLElement | null {
    let prev = markerRef.current?.parentElement ?? null
    while (prev) {
      const found = prev.tagName === 'ARTICLE' ? prev : prev.querySelector('article')
      if (found) return found as HTMLElement
      prev = prev.parentElement
    }
    return document.querySelector('article')
  }

  // Питаємо збережену позицію один раз при відкритті.
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    let cancelled = false
    fetch(`/api/reading-progress?slug=${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { item?: { position_px?: number; percent?: number } | null } | null) => {
        if (cancelled || !d?.item) return
        const y = Number(d.item.position_px) || 0
        const pc = Number(d.item.percent) || 0
        // Уже майже дочитане або щойно відкрите — не набридаємо.
        if (y <= 0 || pc < MIN_RESUME_SHARE * 100 || pc > MAX_RESUME_SHARE * 100) return
        // Якщо читач уже сам прогорнув нижче — пропозиція не потрібна.
        if (window.scrollY > 200) return
        setResumeTo(y)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [slug])

  // Пишемо позицію під час гортання.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const save = () => {
      const article = findArticle()
      if (!article) return
      const rect = article.getBoundingClientRect()
      const top = window.scrollY + rect.top
      const relative = Math.max(0, Math.round(window.scrollY - top))
      const height = article.offsetHeight
      if (height <= 0) return

      const percent = Math.max(0, Math.min(100, Math.round((relative / height) * 100)))
      // Дрібні порухи не шлемо.
      if (Math.abs(relative - savedRef.current) < 120) return
      savedRef.current = relative

      const payload = JSON.stringify({ slug, title, path, contentId, positionPx: relative, percent })
      // keepalive: запит доживає, якщо людина закриває вкладку.
      fetch('/api/reading-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }

    const onScroll = () => {
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        save()
      }, SAVE_THROTTLE_MS)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', save)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', save)
      if (timer) clearTimeout(timer)
    }
  }, [slug, title, path, contentId])

  // Плашка не має висіти вічно: якщо читач її проігнорував і гортає далі,
  // вона зникає сама. 12 секунд — щоб устигла прочитати людина, яка читає
  // повільно, і щоб не заважала тому, хто вже занурився в текст.
  useEffect(() => {
    if (resumeTo === null) return

    const hide = () => setResumeTo(null)
    const t = setTimeout(hide, 12_000)

    // Перший же відчутний рух сторінкою — читач вирішив читати спочатку.
    const startY = window.scrollY
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 400) hide()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
    }
  }, [resumeTo])

  function goToSaved() {
    const article = findArticle()
    if (!article || resumeTo === null) {
      setResumeTo(null)
      return
    }
    const rect = article.getBoundingClientRect()
    const top = window.scrollY + rect.top
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: top + resumeTo, behavior: prefersReduced ? 'auto' : 'smooth' })
    setResumeTo(null)
  }

  return (
    <>
      <span ref={markerRef} aria-hidden="true" style={{ display: 'none' }} />

      {resumeTo !== null && (
        <div
          role="status"
          style={{
            position: 'fixed',
            left: '50%',
            // Над нижньою панеллю сайту, щоб не накривати заголовок твору.
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 108px)',
            transform: 'translateX(-50%)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: 'calc(100vw - 32px)',
            padding: '10px 12px 10px 16px',
            borderRadius: 12,
            background: 'rgba(10, 22, 40, 0.96)',
            border: '1px solid rgba(239, 159, 39, 0.45)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
            color: '#FFF8EE',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 14,
            animation: 'balabony-resume-in 220ms ease-out both',
          }}
        >
          <style>{`
            @keyframes balabony-resume-in {
              from { opacity: 0; transform: translate(-50%, 12px); }
              to   { opacity: 1; transform: translate(-50%, 0); }
            }
            @media (prefers-reduced-motion: reduce) {
              @keyframes balabony-resume-in {
                from { opacity: 1; transform: translate(-50%, 0); }
                to   { opacity: 1; transform: translate(-50%, 0); }
              }
            }
          `}</style>
          <span>Ви вже читали цей текст</span>
          <button
            type="button"
            onClick={goToSaved}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: '#ef9f27',
              color: '#0a1628',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'Montserrat', sans-serif",
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Продовжити
          </button>
          <button
            type="button"
            onClick={() => setResumeTo(null)}
            aria-label="Читати спочатку, сховати підказку"
            style={{
              padding: '6px 8px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: '#FFF8EE',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              opacity: 0.75,
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
