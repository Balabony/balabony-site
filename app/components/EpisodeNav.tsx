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

  const box: React.CSSProperties = {
    flex: '1 1 220px',
    minWidth: 0,
    display: 'block',
    padding: '14px 16px',
    borderRadius: 12,
    border: `1px solid ${gold}55`,
    background: `${gold}0d`,
    textDecoration: 'none',
  }

  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: gold,
    marginBottom: 6,
  }

  const title: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: '#FFF8EE',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  return (
    <nav
      aria-label="Перехід між серіями"
      style={{
        maxWidth: 720,
        margin: '28px auto 0',
        padding: '0 20px',
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
        <Link href={nextUrl} style={{ ...box, textAlign: 'right' }}>
          <div style={label}>Наступна →</div>
          <div style={title}>{nextTitle || 'Наступна серія'}</div>
        </Link>
      )}
    </nav>
  )
}
