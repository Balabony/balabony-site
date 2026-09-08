import Link from 'next/link'

/**
 * Зміст сезону просто на сторінці серії.
 *
 * Читач серіалу тримає в голові, де він у сотні епізодів, і щоб перейти на
 * потрібний, мусив вертатися в каталог. Тут увесь сезон під рукою, поточна
 * серія підсвічена.
 *
 * Серверний компонент, звичайні посилання — жодного JS. Це водночас і
 * перелінковка: кожна серія отримує посилання з усіх інших серій сезону,
 * а не лише з каталогу на сотні позицій.
 */

export type TocItem = {
  slug: string
  title: string
  number: number
}

export default function SeasonToc({
  items,
  currentSlug,
  heading,
  gold = '#ef9f27',
}: {
  items: TocItem[]
  currentSlug: string
  heading: string
  gold?: string
}) {
  if (items.length < 2) return null

  return (
    <details
      style={{
        maxWidth: 720,
        margin: '28px auto 0',
        padding: '0 20px',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: gold,
          padding: '10px 0',
          listStyle: 'none',
        }}
      >
        {heading} — {items.length} {items.length % 10 === 1 && items.length % 100 !== 11 ? 'серія' : 'серій'}
      </summary>

      <ol
        style={{
          listStyle: 'none',
          margin: '6px 0 0',
          padding: 0,
          display: 'grid',
          gap: 2,
          maxHeight: 320,
          overflowY: 'auto',
        }}
      >
        {items.map(it => {
          const current = it.slug === currentSlug
          return (
            <li key={it.slug}>
              <Link
                href={`/episodes/${it.slug}`}
                aria-current={current ? 'page' : undefined}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  background: current ? `${gold}1a` : 'transparent',
                  color: current ? gold : '#d8d2c6',
                  fontSize: 14,
                  fontWeight: current ? 700 : 500,
                }}
              >
                <span aria-hidden="true" style={{ opacity: 0.6, minWidth: 26 }}>
                  {it.number}.
                </span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {it.title}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </details>
  )
}
