'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GENRE_PAGES, isGenre } from '@/lib/genres'

/**
 * Рядок жанрів на головній.
 *
 * Простий перелік посилань, а не форма пошуку й не випадний список: у нас
 * дев'ять жанрів і читачі старшого віку, для яких видимі слова надійніші за
 * будь-який елемент керування. На телефоні дев'ять чіпів переносяться в три
 * рядки — усі видно одразу, гортати вбік не треба.
 *
 * Жанри без творів не показуємо (це вирішує /api/genres/counts), і поки
 * жодного жанру немає — блок не малюється взагалі.
 */

const GOLD = '#ef9f27'
const GOLD_LIGHT = '#fac775'
const FONT = "'Montserrat', Arial, sans-serif"

interface GenreCount {
  genre: string
  count: number
}

export default function GenreChips() {
  const [genres, setGenres] = useState<GenreCount[]>([])

  useEffect(() => {
    fetch('/api/genres/counts')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { genres?: GenreCount[] } | null) => {
        if (d?.genres) setGenres(d.genres)
      })
      .catch(() => {
        /* мовчки: рядок жанрів не критичний для сторінки */
      })
  }, [])

  if (genres.length === 0) return null

  return (
    <section
      aria-labelledby="genre-chips-title"
      style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 20px 40px', fontFamily: FONT }}
    >
      <h2
        id="genre-chips-title"
        style={{ fontSize: 22, fontWeight: 800, color: '#f5f0e8', margin: '0 0 4px' }}
      >
        Що почитати сьогодні
      </h2>
      <p style={{ fontSize: 14, color: 'var(--on-dark-muted, #8899bb)', margin: '0 0 18px' }}>
        Оберіть, до чого лежить душа
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {genres.map(({ genre, count }) => (
          <Link
            key={genre}
            href={isGenre(genre) ? `/stories/zhanr/${GENRE_PAGES[genre].slug}` : `/stories?genre=${encodeURIComponent(genre)}`}
            style={{
              fontSize: 15,
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: 22,
              background: 'rgba(239,159,39,0.16)',
              border: `1px solid ${GOLD}80`,
              color: GOLD_LIGHT,
              textDecoration: 'none',
              lineHeight: 1.2,
              // Палець дорослої людини: цілі нижче 44px промахуються.
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {genre}
            <span style={{ fontWeight: 400, opacity: 0.75, marginLeft: 7, fontSize: 13 }}>
              {count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
