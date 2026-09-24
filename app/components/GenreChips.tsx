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

/**
 * ЧИТАЦЬКА НАЗВА НА ЧІПАХ (17.09.2026).
 *
 * Чіпи показували назву жанру З БАЗИ: «Казка», «Детектив», «Драма». Але
 * сторінки, на які вони ведуть, мають інші заголовки — «Казки на ніч»,
 * «Українські детективи», «Сумні історії», — і саме ці фрази люди вводять
 * у пошук. Розходження коштувало двічі: читач на головній не впізнавав
 * розділ, а внутрішнє посилання підказувало Google слово, за яким нас не
 * шукають («казка» проти «казки на ніч» — 10–100 тис./міс).
 *
 * Текст посилання — найсильніший сигнал, який одна сторінка передає іншій,
 * тож він має збігатися із заголовком сторінки-адресата.
 */
function chipLabel(genre: string): string {
  return isGenre(genre) ? GENRE_PAGES[genre].title : genre
}

/**
 * Казки ведуть на /fairytales — вона канонічна з 17.09 (та сама добірка
 * плюс секція оповідань для дітей). Посилати на неканонічну адресу зі
 * сторінки, яка має найбільшу вагу на сайті, — витрачати її намарно.
 */
function chipHref(genre: string): string {
  if (!isGenre(genre)) return `/stories?genre=${encodeURIComponent(genre)}`
  if (genre === 'Казка') return '/fairytales'
  return `/stories/zhanr/${GENRE_PAGES[genre].slug}`
}

export default function GenreChips({ initial }: { initial?: GenreCount[] } = {}) {
  // Готовий перелік із сервера: інакше дев'ять посилань на сторінки жанрів
  // з'являлися лише в браузері, і пошуковик по них не переходив.
  const [genres, setGenres] = useState<GenreCount[]>(initial ?? [])

  useEffect(() => {
    if (initial) return
    fetch('/api/genres/counts')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { genres?: GenreCount[] } | null) => {
        if (d?.genres) setGenres(d.genres)
      })
      .catch(() => {
        /* мовчки: рядок жанрів не критичний для сторінки */
      })
  }, [initial])

  if (genres.length === 0) return null

  return (
    <section
      aria-labelledby="genre-chips-title"
      style={{ maxWidth: 1000 /* s2072: 960 вмісту + 2×20 відступу — у лінію з рештою головної */, margin: '0 auto', padding: '8px 20px 40px', fontFamily: FONT }}
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

      {/* Сітка, а не flex-wrap: чіпи різної довжини лягали драбинкою —
          широкий жанр займав рядок сам, поруч лишалася порожнеча.
          Рівні колонки шикують їх у стовпці незалежно від довжини назви. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))',
        gap: 9,
      }}>
        {genres.map(({ genre, count }) => (
          <Link
            key={genre}
            href={chipHref(genre)}
            style={{
              fontSize: 15,
              fontWeight: 700,
              padding: '10px 12px',
              borderRadius: 22,
              background: 'rgba(239,159,39,0.16)',
              border: `1px solid ${GOLD}80`,
              color: GOLD_LIGHT,
              textDecoration: 'none',
              lineHeight: 1.2,
              // Палець дорослої людини: цілі нижче 44px промахуються.
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {chipLabel(genre)}
            <span style={{ fontWeight: 400, opacity: 0.75, marginLeft: 7, fontSize: 13 }}>
              {count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
