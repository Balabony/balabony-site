'use client'

import { useEffect, useState } from 'react'
import { findContest } from '@/lib/contests'

/**
 * Відкрита таблиця зарахованих дочитувань під кожним конкурсом.
 *
 * Це виконання обіцянки з умов, розділ «Що видно всім»: показник по
 * кожній роботі відкритий і оновлюється постійно. До першої публікації
 * показувати нічого — блок не з'являється взагалі, а не висить порожній
 * із написом «поки немає даних».
 *
 * Число тягнеться з /api/konkursy/reads, а не з розмітки сторінки:
 * сторінка конкурсів статична і перезбирається раз на годину, тобто
 * вбудоване в неї число було б застиглим.
 */

type Row = {
  entryId: string
  contest: string
  title: string
  author: string
  episodes: number
  counted: number
}

/**
 * Один запит на всю сторінку. Компонент стоїть під кожним із чотирьох
 * конкурсів; без спільної обіцянки браузер робив би чотири однакові
 * запити при кожному відкритті сторінки.
 */
let shared: Promise<Row[]> | null = null

function load(): Promise<Row[]> {
  if (!shared) {
    shared = fetch('/api/konkursy/reads', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { rows: [] }))
      .then(d => (Array.isArray(d?.rows) ? (d.rows as Row[]) : []))
      .catch(() => [])
  }
  return shared
}

export type ReadsColors = {
  title: string
  body: string
  edge: string
  stripe: string
  line: string
}

const DEFAULT_COLORS: ReadsColors = {
  title:  '#FAC775',
  body:   '#dbe4f0',
  edge:   'rgba(239,159,39,0.35)',
  stripe: 'rgba(239,159,39,0.08)',
  line:   '#ef9f27',
}

export default function ContestReads({
  contest,
  colors = DEFAULT_COLORS,
}: {
  contest: string
  colors?: ReadsColors
}) {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    let alive = true
    load().then(all => {
      if (alive) setRows(all.filter(r => r.contest === contest))
    })
    return () => {
      alive = false
    }
  }, [contest])

  if (rows.length === 0) return null

  const threshold = findContest(contest)?.threshold ?? 50
  const total = findContest(contest)?.episodes ?? 1

  return (
    <div
      style={{
        marginTop: 26,
        padding: '20px 18px',
        borderRadius: 12,
        border: `1px solid ${colors.edge}`,
        background: colors.stripe,
      }}
    >
      <h3
        style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 18,
          fontWeight: 700,
          color: colors.title,
          margin: '0 0 4px',
        }}
      >
        Зараховані дочитування
      </h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: colors.body, opacity: 0.85, margin: '0 0 14px' }}>
        Оновлюється постійно. Поріг допуску до призових місць — {threshold}{' '}
        {threshold === 1 ? 'дочитування' : 'дочитувань'} за всі серії. Число може
        підрости заднім числом: дочитування зараховується, щойно читач прочитає
        твір іншого автора.
      </p>

      {rows.map((r, i) => {
        const passed = r.counted >= threshold
        return (
          <div
            key={r.entryId}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 14,
              padding: '11px 13px',
              borderRadius: 9,
              marginBottom: 6,
              background: i % 2 === 0 ? 'rgba(0,0,0,0.16)' : 'transparent',
            }}
          >
            <span style={{ minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: 15, color: colors.title, fontWeight: 700 }}>
                {r.title}
              </strong>
              <span style={{ fontSize: 13, color: colors.body, opacity: 0.8 }}>
                {r.author}
                {total > 1 ? ` · вийшло серій: ${r.episodes} з ${total}` : ''}
              </span>
            </span>
            <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <strong style={{ fontSize: 19, fontWeight: 800, color: colors.line }}>{r.counted}</strong>
              <span style={{ display: 'block', fontSize: 11.5, color: colors.body, opacity: 0.75 }}>
                {passed ? 'поріг подолано' : `до порога ${threshold - r.counted}`}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
