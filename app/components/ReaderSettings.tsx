'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* ============================================================
   НАЛАШТУВАННЯ ЧИТАННЯ — базовий обсяг
   ------------------------------------------------------------
   Три речі: шрифт, розмір літер, день/ніч. Свідомо без пресетів
   для слабкого зору й дислексії, без керування інтервалами і без
   контрастної теми — це предмет грантових заявок з окремим
   бюджетом і тестуванням із користувачами, а не побічний ефект
   цього релізу.

   Стан лежить у localStorage і застосовується до першого малювання
   інлайн-скриптом із app/layout.tsx — тому при переході між
   сторінками немає спалаху нічної теми.

   Ключ окремий від balabony_a11y (сторінка /accessibility). Той
   масштаб діє на весь сайт через body{zoom} і множиться з цим:
   читач бачить результат наживо й зупиняється, де зручно.
   ============================================================ */

const READER_KEY = 'balabony_reader_v1'

type Theme = 'night' | 'day'
type Font = 'default' | 'serif' | 'system'

interface Prefs {
  theme: Theme
  font: Font
  scale: number
}

const DEFAULTS: Prefs = { theme: 'night', font: 'default', scale: 1 }

const SCALES = [0.9, 1, 1.15, 1.3, 1.5]

const THEMES: { id: Theme; label: string }[] = [
  { id: 'night', label: '🌙 Ніч' },
  { id: 'day', label: '☀️ День' },
]

const FONTS: { id: Font; label: string; hint: string }[] = [
  { id: 'default', label: 'Як на сайті', hint: 'Montserrat' },
  { id: 'serif', label: 'Із засічками', hint: 'Lora' },
  { id: 'system', label: 'Системний', hint: 'шрифт вашого пристрою' },
]

function load(): Prefs {
  try {
    const raw = localStorage.getItem(READER_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) }
  } catch {
    return DEFAULTS
  }
}

/**
 * Типове значення НЕ записується, а видаляється. Це принципово:
 * кожна читалка має власні базові величини (--r-base, --r-base-ff),
 * і вони мають діяти, поки читач сам нічого не змінив. Запиши ми
 * шрифт «про всяк випадок» — «Тиша» втратила б свій Georgia.
 */
function apply(p: Prefs) {
  const d = document.documentElement
  if (p.theme === DEFAULTS.theme) d.removeAttribute('data-reader-theme')
  else d.setAttribute('data-reader-theme', p.theme)

  if (p.font === DEFAULTS.font) d.removeAttribute('data-reader-font')
  else d.setAttribute('data-reader-font', p.font)

  if (p.scale === DEFAULTS.scale) d.style.removeProperty('--r-scale')
  else d.style.setProperty('--r-scale', String(p.scale))
}

/** У сховище лягає тільки те, що читач змінив — так само, як у apply(). */
function save(p: Prefs) {
  const diff: Record<string, string | number> = {}
  ;(Object.keys(DEFAULTS) as (keyof Prefs)[]).forEach(k => {
    if (p[k] !== DEFAULTS[k]) diff[k] = p[k]
  })
  try {
    if (Object.keys(diff).length === 0) localStorage.removeItem(READER_KEY)
    else localStorage.setItem(READER_KEY, JSON.stringify(diff))
  } catch {
    /* приватний режим — налаштування діють до кінця сеансу */
  }
}

export default function ReaderSettings() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)
  const [msg, setMsg] = useState('')

  const fabRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Атрибути вже стоять (інлайн-скрипт у layout) — тут лише
  // синхронізуємо стан React із тим, що на сторінці.
  useEffect(() => {
    const p = load()
    setPrefs(p)
    apply(p)
  }, [])

  const set = useCallback((patch: Partial<Prefs>, announce?: string) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch }
      apply(next)
      save(next)
      return next
    })
    if (announce) setMsg(announce)
  }, [])

  // Esc закриває, фокус повертається на кнопку
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setOpen(false)
      fabRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>('button')?.focus()
    }, 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open])

  const idx = Math.max(0, SCALES.indexOf(prefs.scale))
  const stepSize = (dir: 1 | -1) => {
    const next = SCALES[Math.min(SCALES.length - 1, Math.max(0, idx + dir))]
    if (next === prefs.scale) return
    set({ scale: next }, `Розмір тексту ${Math.round(next * 100)} відсотків`)
  }

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className="rs-fab"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Налаштування читання: шрифт, розмір, тло"
        title="Налаштування читання"
        onClick={() => setOpen(v => !v)}
      >
        Аа
      </button>

      {open && (
        <>
          <div className="rs-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            ref={sheetRef}
            className="rs-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rs-title"
          >
            <div className="rs-head">
              <h2 className="rs-title" id="rs-title">Як вам читати зручно</h2>
              <button
                type="button"
                className="rs-close"
                aria-label="Закрити налаштування"
                onClick={() => {
                  setOpen(false)
                  fabRef.current?.focus()
                }}
              >
                ✕
              </button>
            </div>

            <div className="rs-group">
              <span className="rs-legend">Тло</span>
              <div className="rs-row">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className="rs-btn"
                    aria-pressed={prefs.theme === t.id}
                    onClick={() => set({ theme: t.id }, `Тло: ${t.label}`)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rs-group">
              <span className="rs-legend">Шрифт</span>
              <div className="rs-row">
                {FONTS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className="rs-btn"
                    aria-pressed={prefs.font === f.id}
                    aria-label={`Шрифт: ${f.label} — ${f.hint}`}
                    onClick={() => set({ font: f.id }, `Шрифт: ${f.label}`)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rs-group">
              <span className="rs-legend">Розмір літер</span>
              <div className="rs-size">
                <button
                  type="button"
                  className="rs-btn"
                  aria-label="Зменшити текст"
                  disabled={idx === 0}
                  onClick={() => stepSize(-1)}
                >
                  А−
                </button>
                <output>{Math.round(prefs.scale * 100)}%</output>
                <button
                  type="button"
                  className="rs-btn"
                  aria-label="Збільшити текст"
                  disabled={idx === SCALES.length - 1}
                  onClick={() => stepSize(1)}
                >
                  А+
                </button>
              </div>
            </div>

            <p className="rs-note">
              Налаштування зберігаються у вашому браузері й діють на всі тексти
              Балабонів. Ширші можливості —{' '}
              <a href="/accessibility">сторінка доступності</a>.
            </p>

            <div className="rs-sr" role="status" aria-live="polite">{msg}</div>
          </div>
        </>
      )}
    </>
  )
}
