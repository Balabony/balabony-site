import { getFreshStories, getHomeSeries } from '@/lib/home-data'
import { getMostFinished } from '@/lib/most-finished'
import { CONTESTS, isOpen, prizeFund } from '@/lib/contests'
import MostFinished from './MostFinished'
import FreshStoriesGrid from './FreshStoriesGrid'

/**
 * «Найцікавіше на Балабонах» (17.10.2026) — блок для посадкових сторінок
 * реклами (клуб, календарі, пільга, підтримка). Людина прийшла по календар
 * чи пільгу — показуємо їй, заради чого варто лишитися: історії, які
 * дочитують, свіжі історії з обкладинками, серіал і відкриті конкурси.
 * Серверний компонент: посилання потрапляють у HTML (перелінковка для Google).
 */
const GOLD = '#EF9F27'
const GOLD_L = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#B8C6D8'
const CARD = '#14253B'
const SERIF = "'Lora', Georgia, serif"
const SANS = "'Montserrat', Arial, sans-serif"

export default async function BestOfBalabony() {
  const [finished, fresh, series] = await Promise.all([
    getMostFinished(5, { storiesOnly: true, onePerAuthor: true }).catch(() => []),
    getFreshStories(6).catch(() => []),
    getHomeSeries(1).catch(() => []),
  ])
  const open = CONTESTS.filter((c) => isOpen(c)).sort((a, b) => a.closesAt.localeCompare(b.closesAt))
  const first = series[0]

  return (
    <section aria-labelledby="best-title" style={{ background: '#0B1626', padding: '36px 0 20px', fontFamily: SANS, color: CREAM }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
        <p style={{ margin: 0, color: GOLD, fontWeight: 700, letterSpacing: '.08em', fontSize: '.85rem' }}>БЕЗКОШТОВНО · ЧИТАТИ ОНЛАЙН</p>
        <h2 id="best-title" style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 3.4vw, 2rem)', color: GOLD_L, margin: '.3rem 0 .4rem' }}>
          Найцікавіше на Балабонах
        </h2>
        <p style={{ color: MUTED, margin: '0 0 1.2rem', lineHeight: 1.6, maxWidth: '60ch' }}>
          Понад тисяча сучасних українських історій від сотні авторів — життєві, сімейні, про кохання, смішні. Почніть з тих, які читачі проходять до останнього рядка.
        </p>

        {open.length > 0 && (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 18 }}>
            {open.map((c) => (
              <a key={c.id} href={`/konkursy/${c.id}`} style={{ display: 'block', background: CARD, border: '1px solid rgba(239,159,39,.4)', borderRadius: 14, padding: '14px 16px', color: CREAM, textDecoration: 'none' }}>
                <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#22c55e' }}>КОНКУРС · ПРИЙОМ ТРИВАЄ</span>
                <strong style={{ display: 'block', fontFamily: SERIF, fontWeight: 400, fontSize: '1.15rem', color: GOLD_L, margin: '.3rem 0' }}>{c.name}</strong>
                <span style={{ color: GOLD, fontWeight: 800 }}>Призовий фонд {prizeFund(c)} →</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <MostFinished items={finished} />

      {fresh.length > 0 && (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
          <h3 style={{ fontFamily: "'Comfortaa', sans-serif", fontSize: 'clamp(19px, 4.6vw, 24px)', color: GOLD_L, margin: '8px 0 4px' }}>Свіжі історії</h3>
        </div>
      )}
      {fresh.length > 0 && <FreshStoriesGrid stories={fresh} />}

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '12px 20px 0', display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {first && (
          <a href={first.url} style={{ display: 'block', background: CARD, border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '14px 16px', color: CREAM, textDecoration: 'none' }}>
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: GOLD }}>СЕРІАЛ «БАЛАБОНИ» · НАЗАР КОЛОДІЙ</span>
            <strong style={{ display: 'block', fontFamily: SERIF, fontWeight: 400, fontSize: '1.15rem', color: GOLD_L, margin: '.3rem 0' }}>{first.title}</strong>
            <span style={{ color: MUTED }}>Сільські байки про діда Панаса — перші серії безкоштовно →</span>
          </a>
        )}
        <a href="/stories" style={{ display: 'block', background: CARD, border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '14px 16px', color: CREAM, textDecoration: 'none' }}>
          <span style={{ fontSize: '.78rem', fontWeight: 700, color: GOLD }}>УСІ ІСТОРІЇ</span>
          <strong style={{ display: 'block', fontFamily: SERIF, fontWeight: 400, fontSize: '1.15rem', color: GOLD_L, margin: '.3rem 0' }}>Каталог Балабонів</strong>
          <span style={{ color: MUTED }}>Життєві, сімейні, про кохання, смішні, про війну →</span>
        </a>
        <a href="/fairytales" style={{ display: 'block', background: CARD, border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '14px 16px', color: CREAM, textDecoration: 'none' }}>
          <span style={{ fontSize: '.78rem', fontWeight: 700, color: GOLD }}>ДЛЯ ДІТЕЙ</span>
          <strong style={{ display: 'block', fontFamily: SERIF, fontWeight: 400, fontSize: '1.15rem', color: GOLD_L, margin: '.3rem 0' }}>Казки на ніч</strong>
          <span style={{ color: MUTED }}>Короткі казки, які встигаєш прочитати перед сном →</span>
        </a>
      </div>
    </section>
  )
}
