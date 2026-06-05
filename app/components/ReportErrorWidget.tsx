'use client'

import { useEffect, useState, useCallback } from 'react'

const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

interface ReportErrorWidgetProps {
  /**
   * CSS-селектор контейнера, всередині якого реагуємо на виділення тексту.
   * Якщо не передано — слухаємо весь документ.
   * Приклад: 'article', '.episode-body'.
   */
  selectionScope?: string
}

/**
 * Віджет «Знайшли помилку?».
 *
 * Два сценарії:
 *   1. Користувач виділяє фрагмент тексту (мишею або тапом+drag на мобільному)
 *      → з'являється спливаючий тост біля виділення з кнопкою «Повідомити про помилку».
 *      Натискання → перехід на /contact?topic=error&url=...&fragment=...
 *   2. Внизу справа завжди видно компактну кнопку «Знайшли помилку?»
 *      → перехід на /contact?topic=error&url=... (без фрагменту)
 *
 * Працює лише на клієнті (use client).
 */
export default function ReportErrorWidget({ selectionScope }: ReportErrorWidgetProps) {
  const [toast, setToast] = useState<{ x: number; y: number; text: string } | null>(null)

  // Обчислюємо позицію і текст виділення
  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setToast(null)
      return
    }

    const text = sel.toString().trim()

    // Мінімальна довжина — щоб не зривалось на випадкових кліках
    if (text.length < 3) {
      setToast(null)
      return
    }

    // Перевіряємо що виділення в межах потрібного скоупу
    if (selectionScope) {
      const scopeEl = document.querySelector(selectionScope)
      if (scopeEl) {
        const range = sel.getRangeAt(0)
        if (!scopeEl.contains(range.commonAncestorContainer)) {
          setToast(null)
          return
        }
      }
    }

    // Позиція тоста — над виділенням, по центру
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      setToast(null)
      return
    }

    const x = rect.left + rect.width / 2 + window.scrollX
    const y = rect.top + window.scrollY - 12 // 12px над виділенням

    setToast({ x, y, text })
  }, [selectionScope])

  useEffect(() => {
    // selectionchange спрацьовує під час drag — нам треба після відпускання.
    // Тому слухаємо mouseup + touchend + keyup (для Shift+стрілки).
    const handler = () => {
      // Невелика затримка щоб window.getSelection() встиг оновитись
      setTimeout(handleSelectionChange, 10)
    }

    document.addEventListener('mouseup', handler)
    document.addEventListener('touchend', handler)
    document.addEventListener('keyup', handler)

    // Закривати тост при кліку поза виділенням
    const closeOnEmptySelection = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) setToast(null)
    }
    document.addEventListener('selectionchange', closeOnEmptySelection)

    return () => {
      document.removeEventListener('mouseup', handler)
      document.removeEventListener('touchend', handler)
      document.removeEventListener('keyup', handler)
      document.removeEventListener('selectionchange', closeOnEmptySelection)
    }
  }, [handleSelectionChange])

  function buildHref(fragment?: string): string {
    const url = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
    const params = new URLSearchParams()
    params.set('topic', 'error')
    if (url) params.set('url', url)
    if (fragment) params.set('fragment', fragment.slice(0, 500)) // обмежуємо щоб не зламати URL
    return `/contact?${params.toString()}`
  }

  return (
    <>
      {/* Тост при виділенні */}
      {toast && (
        <a
          href={buildHref(toast.text)}
          style={{
            position: 'absolute',
            left: toast.x,
            top: toast.y,
            transform: 'translate(-50%, -100%)',
            background: '#0f1e3a',
            border: `1.5px solid ${GOLD}`,
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            color: GOLD,
            textDecoration: 'none',
            fontFamily: FONT,
            boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
            zIndex: 9998,
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
          onMouseDown={(e) => {
            // Не даємо браузеру скинути виділення при кліку
            e.preventDefault()
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1 L13 12 L1 12 Z" stroke={GOLD} strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
            <path d="M7 5 V8" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="7" cy="10" r="0.7" fill={GOLD}/>
          </svg>
          Повідомити про помилку
          {/* Маленька стрілочка вниз */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -6,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${GOLD}`,
            }}
          />
        </a>
      )}

      {/* Фіксована кнопка внизу справа */}
      <a
        href={buildHref()}
        style={{
          position: 'fixed',
          bottom: 88,
          right: 20,
          background: 'rgba(15,30,58,0.92)',
          border: `1px solid ${GOLD}66`,
          borderRadius: 22,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 600,
          color: GOLD,
          textDecoration: 'none',
          fontFamily: FONT,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          zIndex: 9997,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          transition: 'border-color 0.2s, background 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = GOLD
          e.currentTarget.style.background = 'rgba(15,30,58,1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${GOLD}66`
          e.currentTarget.style.background = 'rgba(15,30,58,0.92)'
        }}
        title="Знайшли друкарську помилку або щось не так? Напишіть нам."
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1 L13 12 L1 12 Z" stroke={GOLD} strokeWidth="1.4" strokeLinejoin="round" fill="none"/>
          <path d="M7 5 V8" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="7" cy="10" r="0.7" fill={GOLD}/>
        </svg>
        Знайшли помилку?
      </a>
    </>
  )
}
