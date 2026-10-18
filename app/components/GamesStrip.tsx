/**
 * «Відпочиньте між історіями» (18.10.2026) — посилання на безкоштовні ігри.
 * Стоїть під текстом історії та в блоці «Найцікавіше» на посадкових сторінках.
 * Мета — дати читачеві наступну дію й перелінкувати 12 сторінок /games для Google.
 * Без тверджень про користь для здоров'я: лише назви ігор («безкоштовні ігри онлайн»).
 * Серверний компонент: посилання потрапляють у HTML.
 */
const GOLD = '#EF9F27'
const GOLD_L = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#B8C6D8'
const CARD = '#14253B'
const SERIF = "'Lora', Georgia, serif"
const SANS = "'Montserrat', Arial, sans-serif"

const GAMES = [
  { href: '/games/checkers', title: 'Шашки' },
  { href: '/games/chess', title: 'Шахи' },
  { href: '/games/narde', title: 'Довгі нарди' },
  { href: '/games/sudoku', title: 'Судоку' },
  { href: '/games/domino', title: 'Доміно' },
  { href: '/games/maze', title: 'Лабіринт' },
]

export default function GamesStrip({ compact = false, source }: { compact?: boolean; source: string }) {
  return (
    <section
      aria-labelledby="games-strip-title"
      style={{ margin: compact ? '28px 0 0' : '36px 0 0', fontFamily: SANS, color: CREAM }}
    >
      <div style={{ background: CARD, border: '1px solid rgba(239,159,39,.35)', borderRadius: 14, padding: '16px 18px' }}>
        <p style={{ margin: 0, color: GOLD, fontWeight: 700, letterSpacing: '.08em', fontSize: '.78rem' }}>
          БЕЗКОШТОВНО · БЕЗ РЕЄСТРАЦІЇ
        </p>
        <h2 id="games-strip-title" style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '1.25rem', color: GOLD_L, margin: '.3rem 0 .6rem' }}>
          Відпочиньте між історіями
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GAMES.map((g) => (
            <li key={g.href}>
              <a
                href={g.href}
                data-games-src={source}
                style={{ display: 'inline-block', padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.18)', color: CREAM, textDecoration: 'none', fontSize: 15 }}
              >
                {g.title}
              </a>
            </li>
          ))}
        </ul>
        <a href="/games" data-games-src={source} style={{ display: 'inline-block', marginTop: 12, color: GOLD, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          Усі безкоштовні ігри онлайн →
        </a>
        <span style={{ display: 'block', marginTop: 4, color: MUTED, fontSize: 13 }}>Грають просто в браузері, на телефоні й комп’ютері.</span>
      </div>
    </section>
  )
}
