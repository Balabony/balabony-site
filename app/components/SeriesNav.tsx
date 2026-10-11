import Link from 'next/link'

/**
 * Навігація по серії автора (12.10.2026).
 *
 * ЗВІДКИ ДАНІ. Автор, підтверджуючи твори за договором, вказує для кожного
 * назву серії й номер частини (contract_works.series_name / series_order).
 * Ці дані лежали в базі, але сторінка твору їх не показувала: 59 частин
 * п'яти романів Леоніда Данільчика читалися як 59 окремих історій, і
 * наступну главу доводилося шукати в загальному каталозі.
 *
 * Номер «частина N з M» рахується за опублікованими частинами, а не
 * за series_order: якщо якусь частину знято з публікації, читач не має
 * побачити «частина 7 з 21», коли на сайті їх двадцять.
 *
 * Серверний компонент без JavaScript: перелік частин — рідний <details>.
 */

export interface SeriesPart {
  slug: string
  title: string
}

const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

export function SeriesBadge({ name, index, total }: { name: string; index: number; total: number }) {
  return (
    <a
      href="#series-nav"
      style={{
        display: 'inline-block', marginTop: 12,
        fontSize: 14, fontWeight: 700, fontFamily: FONT,
        color: 'var(--r-gold, #ef9f27)', textDecoration: 'none',
        borderBottom: '1px solid rgba(239,159,39,0.35)',
      }}
    >
      Серія «{name}» · частина {index + 1} з {total}
    </a>
  )
}

export default function SeriesNav({ name, parts, index }: { name: string; parts: SeriesPart[]; index: number }) {
  const prev = index > 0 ? parts[index - 1] : null
  const next = index < parts.length - 1 ? parts[index + 1] : null

  const btn: React.CSSProperties = {
    flex: '1 1 220px', display: 'block', padding: '12px 16px', borderRadius: 10,
    textDecoration: 'none', fontFamily: FONT, lineHeight: 1.4,
  }

  return (
    <nav
      id="series-nav"
      aria-label={`Серія «${name}»`}
      style={{
        marginTop: 36, padding: '18px 18px 14px', borderRadius: 12,
        background: 'rgba(239,159,39,0.07)', border: '1px solid rgba(239,159,39,0.28)',
        fontFamily: FONT, scrollMarginTop: 80,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#c8d4e8', marginBottom: 12 }}>
        Серія «{name}» · частина {index + 1} з {parts.length}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {next && (
          <Link
            href={`/stories/${next.slug}`}
            rel="next"
            style={{ ...btn, order: 2, background: GOLD, color: '#0a1628' }}
          >
            <span style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>Наступна частина →</span>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 800 }}>{next.title}</span>
          </Link>
        )}
        {prev && (
          <Link
            href={`/stories/${prev.slug}`}
            rel="prev"
            style={{ ...btn, order: 1, border: '1px solid rgba(239,159,39,0.45)', color: '#f5f0e8' }}
          >
            <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#c8d4e8' }}>← Попередня частина</span>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{prev.title}</span>
          </Link>
        )}
        {!next && (
          <div style={{ ...btn, order: 2, color: '#c8d4e8', fontSize: 14, fontWeight: 600 }}>
            Це остання частина серії.
          </div>
        )}
      </div>

      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#c8d4e8', listStyle: 'revert' }}>
          Усі частини ({parts.length})
        </summary>
        <ol style={{ margin: '10px 0 0', paddingLeft: 26, fontSize: 14.5, lineHeight: 1.9 }}>
          {parts.map((p, i) => (
            <li key={p.slug}>
              {i === index ? (
                <span aria-current="page" style={{ color: GOLD, fontWeight: 800 }}>{p.title}</span>
              ) : (
                <Link href={`/stories/${p.slug}`} style={{ color: '#dde6f0', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.18)' }}>
                  {p.title}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </details>
    </nav>
  )
}
