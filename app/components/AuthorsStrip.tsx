'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Рядок «Наші автори» на головній. Клієнтський: app/page.tsx має 'use client',
 * тому дані беремо через /api/authors, а не напряму з бази.
 *
 * Поки список порожній, секція не рендериться взагалі — це прибирає стрибок
 * висоти й порожній заголовок, якщо запит не вдався.
 */

const FONT = "'Montserrat', sans-serif"
const GOLD = '#EF9F27'
const GOLD_LIGHT = '#FAC775'
const CREAM = '#FFF8EE'

type Author = { slug: string; name: string; avatar: string | null; initials: string }

export default function AuthorsStrip({ limit = 8 }: { limit?: number }) {
  const [authors, setAuthors] = useState<Author[]>([])

  useEffect(() => {
    fetch(`/api/authors?limit=${limit}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((rows: Author[]) => {
        if (Array.isArray(rows) && rows.length > 0) setAuthors(rows)
      })
      .catch(() => {})
  }, [limit])

  if (authors.length === 0) return null

  return (
    <section
      aria-labelledby="authors-strip-title"
      style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 20px 28px', fontFamily: FONT }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: 12 }}>
          <h2
            id="authors-strip-title"
            style={{
              fontFamily: "'Lora', serif",
              fontWeight: 600,
              fontSize: 21,
              color: GOLD_LIGHT,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Наші автори
          </h2>
          <p style={{ fontSize: 12, color: '#C08A2E', margin: '3px 0 0', lineHeight: 1.25 }}>
            люди, які пишуть для Balabony
          </p>
        </div>
        <Link
          href="/avtory"
          style={{
            fontSize: 12,
            color: GOLD,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          усі автори →
        </Link>
      </div>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
          gap: 12,
        }}
      >
        {authors.map(a => (
          <li key={a.slug} style={{ minWidth: 0 }}>
            <Link
              href={`/avtor/${a.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: a.avatar ? '#17273D' : 'rgba(239,159,39,0.12)',
                  border: `1.5px solid ${a.avatar ? 'rgba(239,159,39,0.45)' : GOLD}`,
                }}
              >
                {a.avatar ? (
                  // Звичайний img: аватарки роздаються з Supabase Storage,
                  // next/image дав би зайві трансформації без користі.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.avatar}
                    alt=""
                    width={72}
                    height={72}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <span style={{ fontSize: 22, fontWeight: 700, color: GOLD_LIGHT }}>
                    {a.initials}
                  </span>
                )}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: CREAM,
                  textAlign: 'center',
                  lineHeight: 1.25,
                  minWidth: 0,
                }}
              >
                {a.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
