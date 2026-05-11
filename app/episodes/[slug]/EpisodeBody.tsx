'use client'
import { useEffect, useState, useRef } from 'react'
interface Props {
  html: string
  fontFamily: string
}
export default function EpisodeBody({ html, fontFamily }: Props) {
  const [toastVisible, setToastVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const articleRef = useRef<HTMLElement | null>(null)
  function showToast() {
    setToastVisible(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToastVisible(false), 3000)
  }
  useEffect(() => {
    const el = articleRef.current
    if (!el) return
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); showToast() }
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); showToast() }
    const onContextMenu = (e: MouseEvent) => { e.preventDefault(); showToast() }
    const onDragStart = (e: DragEvent) => { e.preventDefault() }
    el.addEventListener('copy', onCopy)
    el.addEventListener('cut', onCut)
    el.addEventListener('contextmenu', onContextMenu)
    el.addEventListener('dragstart', onDragStart)
    return () => {
      el.removeEventListener('copy', onCopy)
      el.removeEventListener('cut', onCut)
      el.removeEventListener('contextmenu', onContextMenu)
      el.removeEventListener('dragstart', onDragStart)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
  return (
    <>
      <article
        ref={articleRef}
        style={{
          fontSize: 16,
          lineHeight: 1.9,
          color: '#dde6f0',
          fontFamily,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          WebkitTouchCallout: 'none',
          WebkitUserDrag: 'none',
        } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {toastVisible && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 32,
            transform: 'translateX(-50%)',
            background: 'rgba(10,22,40,0.96)',
            color: '#f5f0e8',
            border: '1px solid rgba(240,165,0,0.4)',
            borderRadius: 12,
            padding: '14px 22px',
            fontSize: 14,
            fontFamily,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 1000,
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          Текст захищено. Поділіться посиланням замість тексту.
        </div>
      )}
    </>
  )
}