'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * «Моя бібліотека» в профілі: збережене й недочитане.
 *
 * Два списки поруч, бо це різні речі: закладку читач поставив свідомо,
 * а недочитане з'явилося саме, поки він гортав. Обидва беруться з сервера,
 * тож для залогіненого збігаються на всіх пристроях.
 *
 * Стилі темні — під загальну гаму сайту.
 */

type Bookmark = { slug: string; title: string | null; path: string }
type Progress = { slug: string; title: string | null; path: string; percent: number }

export default function MyLibrary() {
  const [saved, setSaved] = useState<Bookmark[] | null>(null)
  const [reading, setReading] = useState<Progress[] | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/bookmarks?limit=20')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { items?: Bookmark[] } | null) => {
        if (!cancelled) setSaved(Array.isArray(d?.items) ? d.items : [])
      })
      .catch(() => !cancelled && setSaved([]))

    fetch('/api/reading-progress?limit=6')
      .then(r => (r.ok ? r.json() : null))
      .then((d: { items?: Progress[] } | null) => {
        if (!cancelled) setReading(Array.isArray(d?.items) ? d.items : [])
      })
      .catch(() => !cancelled && setReading([]))

    return () => {
      cancelled = true
    }
  }, [])

  const nothing =
    saved !== null && reading !== null && saved.length === 0 && reading.length === 0

  // Поки нічого не почато й не збережено, місця не займаємо.
  if (nothing) return null

  const heading: React.CSSProperties = {
    fontSize: '0.85rem',
    color: '#8CA0B8',
    marginBottom: '0.5rem',
  }

  const item: React.CSSProperties = {
    display: 'block',
    padding: '0.7rem 0.85rem',
    borderRadius: 8,
    border: '1px solid rgba(239,159,39,0.28)',
    background: 'rgba(239,159,39,0.06)',
    textDecoration: 'none',
    color: '#FFF8EE',
    fontSize: '0.95rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
  }

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      {reading !== null && reading.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={heading}>Продовжити читання</div>
          {reading.map(r => (
            <Link key={r.slug} href={r.path} style={item}>
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.title || 'Без назви'}
              </div>
              <div
                aria-hidden="true"
                style={{
                  height: 3,
                  borderRadius: 999,
                  background: 'rgba(255,248,238,0.16)',
                  marginTop: 7,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(3, Math.min(100, r.percent))}%`,
                    height: '100%',
                    background: '#ef9f27',
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      {saved !== null && saved.length > 0 && (
        <div>
          <div style={heading}>Збережене</div>
          {saved.map(b => (
            <Link key={b.slug} href={b.path} style={item}>
              <span aria-hidden="true" style={{ color: '#ef9f27', marginRight: 8 }}>
                ✓
              </span>
              {b.title || 'Без назви'}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
