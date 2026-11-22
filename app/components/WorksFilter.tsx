'use client'

import { useEffect, useState } from 'react'

/**
 * Пошук і фільтр у переліку творів кабінету.
 *
 * Навіщо. У Богдана 138 творів, у Леоніда 62. Щоб додати обкладинку до одного,
 * доводилося гортати всю сторінку. Після появи форми додавання (09.09.2026)
 * переліки ростимуть швидше.
 *
 * Чому фільтр працює по DOM, а не перебудовує список. Перелік рендериться на
 * сервері разом з обкладинками, кнопками публікації і формами редагування —
 * переносити все це в клієнтський компонент означало б переписати половину
 * кабінету заради поля пошуку. Тут ми лише ховаємо готові картки: сервер
 * проставляє data-work і data-status, ми ставимо display.
 *
 * Заголовок групи ховаємо теж, коли в ній не лишилося видимих карток —
 * інакше лишаються порожні смуги «ОКРЕМІ ІСТОРІЇ · 1» без жодного твору.
 */

const AMBER = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

type Mode = 'all' | 'draft' | 'published'
type Sort = 'default' | 'new' | 'old'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'default', label: 'Звичайний порядок' },
  { id: 'new', label: 'Спочатку нові' },
  { id: 'old', label: 'Спочатку старі' },
]

const MODES: { id: Mode; label: string }[] = [
  { id: 'all', label: 'Усі' },
  { id: 'draft', label: 'Чернетки' },
  { id: 'published', label: 'Опубліковані' },
]

export default function WorksFilter({ total, showSearch = true }: { total: number; showSearch?: boolean }) {
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<Mode>('all')
  const [shown, setShown] = useState(total)
  const [sort, setSort] = useState<Sort>('default')

  // Сортування за датою (пропозиція авторки, 22.11.2026). Як і фільтр, працює по DOM:
  // картки вже відрендерені сервером, ми лише переставляємо їх усередині групи.
  // «Звичайний порядок» повертає серверний порядок за data-idx, який ставимо при першому запуску.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-group]').forEach(g => {
      const header = g.firstElementChild as HTMLElement | null
      if (!header) return
      const cards = Array.from(g.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('data-work'),
      )
      cards.forEach((el, i) => { if (!el.dataset.idx) el.dataset.idx = String(i) })
      const key = (el: HTMLElement) => Date.parse(el.dataset.date || '') || 0
      const sorted = [...cards].sort((a, b) => {
        if (sort === 'default') return Number(a.dataset.idx) - Number(b.dataset.idx)
        // твори без дати — в кінці в обох напрямках
        const ka = key(a), kb = key(b)
        if (!ka && !kb) return 0
        if (!ka) return 1
        if (!kb) return -1
        return sort === 'new' ? kb - ka : ka - kb
      })
      let ref: HTMLElement = header
      for (const el of sorted) { ref.after(el); ref = el }
    })
  }, [sort])

  useEffect(() => {
    const needle = q.trim().toLowerCase()
    let visible = 0

    document.querySelectorAll<HTMLElement>('[data-work]').forEach(el => {
      const title = (el.dataset.work ?? '').toLowerCase()
      const status = el.dataset.status ?? ''

      const byText = !needle || title.includes(needle)
      const byMode =
        mode === 'all' ||
        (mode === 'draft' && status === 'draft') ||
        (mode === 'published' && (status === 'published' || status === 'approved'))

      const ok = byText && byMode
      el.style.display = ok ? '' : 'none'
      if (ok) visible++
    })

    // Групи без жодної видимої картки ховаємо разом із заголовком.
    document.querySelectorAll<HTMLElement>('[data-group]').forEach(g => {
      const any = Array.from(g.querySelectorAll<HTMLElement>('[data-work]'))
        .some(el => el.style.display !== 'none')
      g.style.display = any ? '' : 'none'
    })

    setShown(visible)
  }, [q, mode])

  const filtering = q.trim() !== '' || mode !== 'all'

  return (
    <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid rgba(143,163,196,0.25)' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {showSearch && <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Знайти твір за назвою"
          style={{
            flex: '1 1 220px',
            fontFamily: FONT, fontSize: '0.9rem',
            color: '#1c1917', background: '#f6f1e7',
            border: '1px solid rgba(143,163,196,0.45)',
            borderRadius: 8, padding: '8px 11px',
          }}
        />}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as Sort)}
          aria-label="Порядок творів"
          style={{
            fontFamily: FONT, fontSize: '0.85rem',
            color: '#1c1917', background: '#f6f1e7',
            border: '1px solid rgba(143,163,196,0.45)',
            borderRadius: 8, padding: '7px 10px',
          }}
        >
          {SORTS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        {MODES.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            style={{
              fontFamily: FONT, fontSize: '0.85rem',
              fontWeight: mode === m.id ? 700 : 500,
              color: mode === m.id ? '#0a1628' : AMBER,
              background: mode === m.id ? AMBER : 'transparent',
              border: `1px solid ${mode === m.id ? AMBER : 'rgba(239,159,39,0.45)'}`,
              borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {filtering && (
        <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#8fa3c4', fontFamily: FONT }}>
          {shown === 0
            ? 'Нічого не знайшлося. Спробуйте інше слово або оберіть «Усі».'
            : `Показано ${shown} із ${total}.`}
        </div>
      )}
    </div>
  )
}
