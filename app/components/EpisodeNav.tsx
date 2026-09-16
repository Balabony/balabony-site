import Link from 'next/link'

/**
 * Перехід між серіями внизу тексту — двома видимими кнопками.
 *
 * Стрілки ← → лишаються, але вони працюють лише на комп'ютері й лише коли
 * читач про них знає. Більшість читає з телефона, де клавіатури немає, тож
 * головний спосіб має бути видимим.
 *
 * Серверний компонент: ніякого JS, звичайні посилання — працює завжди,
 * зокрема без мережі зі збереженої сторінки.
 */

export default function EpisodeNav({
  prevUrl,
  prevTitle,
  nextUrl,
  nextTitle,
  gold = '#ef9f27',
}: {
  prevUrl?: string
  prevTitle?: string
  nextUrl?: string
  nextTitle?: string
  gold?: string
}) {
  if (!prevUrl && !nextUrl) return null

  // Дві однакові напівпрозорі картки поруч не показували читачеві, куди
  // йти: «попередня» виглядала так само вагомо, як «наступна». Тепер
  // наступна — залита золотом (єдина дія на екрані, що веде далі), а
  // попередня лишається тихою: нею користуються рідко, і вона потрібна
  // радше пошуковому роботу, ніж людині.
  const box: React.CSSProperties = {
    flex: '1 1 220px',
    minWidth: 0,
    display: 'block',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'transparent',
    textDecoration: 'none',
  }

  const boxNext: React.CSSProperties = {
    ...box,
    border: `1px solid ${gold}`,
    background: gold,
    textAlign: 'right',
  }

  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 6,
  }

  // На золотому тлі світлий текст дав би 1,9:1. Темно-синій — 8,8:1.
  const labelNext: React.CSSProperties = { ...label, color: 'rgba(14,26,43,0.72)' }

  const title: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: '#FFF8EE',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const titleNext: React.CSSProperties = { ...title, color: '#0e1a2b', fontWeight: 700 }

  return (
    <nav
      aria-label="Перехід між серіями"
      style={{
        margin: '28px 0 0',
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      {prevUrl && (
        <Link href={prevUrl} style={box}>
          <div style={label}>← Попередня</div>
          <div style={title}>{prevTitle || 'Попередня серія'}</div>
        </Link>
      )}

      {nextUrl && (
        <Link href={nextUrl} style={boxNext}>
          <div style={labelNext}>Наступна серія</div>
          <div style={titleNext}>{nextTitle || 'Наступна серія'} →</div>
        </Link>
      )}
    </nav>
  )
}
