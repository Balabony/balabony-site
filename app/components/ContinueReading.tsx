'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * «Продовжити читання» — недочитане цим читачем.
 *
 * Дані приходять із /api/reading-progress: для залогінених прогрес спільний
 * на всіх пристроях, для решти — у межах браузера. Показуємо лише те, що
 * почато й не дочитано (API фільтрує 3-94%).
 *
 * Блок свідомо стоїть НИЖЧЕ першого екрана і має зарезервовану висоту:
 * список приходить уже після відкриття сторінки, і без резерву він зсував би
 * усе під собою — рівно той CLS, який ми довго прибирали.
 */

type Item = {
  slug: string
  title: string | null
  path: string
  percent: number
}

export default function ContinueReading() {
  const [items, setItems] = useState<Item[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/reading-progress?limit=3')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { items?: Item[] } | null) => {
        if (cancelled) return
        setItems(Array.isArray(d?.items) ? d.items : [])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Поки відповідь не прийшла — місця не займаємо ЗОВСІМ.
  // Раніше тут стояв резерв minHeight: 132, і коли API відповідав «нічого не
  // почато», блок зникав разом із резервом — усе під ним стрибало вгору на
  // ~164px. Для читача без прогресу (а це кожен новий візит і кожен замір
  // PageSpeed) резерв не рятував від зсуву, а створював його.
  if (items === null) return null

  // Нічого не почато — блок не показуємо взагалі.
  if (items.length === 0) return null

  return (
    <section
      aria-label="Продовжити читання"
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '8px 20px 24px',
      }}
    >
      {(
        <>
          <h2
            style={{
              fontFamily: "'Comfortaa', sans-serif",
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: 700,
              color: '#FAC775',
              margin: '0 0 12px',
            }}
          >
            Продовжити читання
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 10,
            }}
          >
            {items.map(it => (
              <Link
                key={it.slug}
                href={it.path}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(239,159,39,0.06)',
                  border: '1px solid rgba(239,159,39,0.32)',
                  textDecoration: 'none',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#FFF8EE',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {it.title || 'Без назви'}
                </div>

                <div
                  aria-hidden="true"
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: 'rgba(255,248,238,0.16)',
                    margin: '10px 0 6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(3, Math.min(100, it.percent))}%`,
                      height: '100%',
                      background: '#ef9f27',
                    }}
                  />
                </div>

                <div
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 12,
                    color: '#C08A2E',
                  }}
                >
                  Прочитано {Math.max(1, Math.min(100, it.percent))}%
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
