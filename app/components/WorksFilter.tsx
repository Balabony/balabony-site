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

const MODES: { id: Mode; label: string }[] = [
  { id: 'all', label: 'Усі' },
  { id: 'draft', label: 'Чернетки' },
  { id: 'published', label: 'Опубліковані' },
]

export default function WorksFilter({ total }: { total: number }) {
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<Mode>('all')
  const [shown, setShown] = useState(total)

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
        <input
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
        />
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
