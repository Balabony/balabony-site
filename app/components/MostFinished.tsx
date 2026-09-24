import { workPath } from '@/lib/rss'
import type { FinishedItem } from '@/lib/most-finished'

/**
 * «Найбільше дочитують» на головній (24.09.2026).
 *
 * Дві причини. Читачеві: у каталозі тисяча творів, а вітрина «свіжих»
 * крутиться за датою — тут те, що інші справді прочитали до кінця.
 * Пошуку: головну Google обходить найчастіше, і посилання звідси —
 * найсильніший внутрішній сигнал, що сторінка важлива. Більшість творів
 * «Виявлено, наразі не проіндексовано», і саме найкращі з них мають
 * потрапити в пошук першими.
 *
 * Свідомо БЕЗ цифр — з тієї ж причини, що й на /top: при наших обсягах
 * «дочитали: 5» каже не про якість твору, а про те, як нас мало читають.
 * Порядок у списку каже все потрібне.
 *
 * Звичайні <a>, не Link: посилання мають бути в HTML для бота, а
 * передзавантаження десяти сторінок тут не потрібне.
 */
export default function MostFinished({ items }: { items: FinishedItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <section
      aria-labelledby="most-finished-title"
      style={{ maxWidth: 1000 /* s2072: 960 вмісту + 2×20 відступу — у лінію з рештою головної */, margin: '0 auto', padding: '8px 20px 24px' }}
    >
      <h2
        id="most-finished-title"
        style={{
          fontFamily: "'Comfortaa', sans-serif",
          fontSize: 'clamp(19px, 4.6vw, 24px)',
          fontWeight: 700,
          color: '#FAC775',
          margin: '0 0 4px',
        }}
      >
        Найбільше дочитують
      </h2>
      <p style={{ margin: '0 0 14px', fontSize: 14, color: '#8CA0B8', fontFamily: "'Montserrat', sans-serif" }}>
        Історії, які читачі проходять до останнього рядка
      </p>
      <ol
        style={{
          listStyle: 'none', margin: 0, padding: 0,
          display: 'grid', gap: 8,
          // s2074: 290, не 320 — на ширині 960 вміщається 3 у ряд (5 = 3 + 2).
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
        }}
      >
        {items.map((it, i) => (
          <li key={`${it.type}-${it.slug}`}>
            <a
              href={workPath(it.type, it.slug)}
              style={{
                display: 'flex', alignItems: 'baseline', gap: 10,
                padding: '12px 14px', borderRadius: 10, textDecoration: 'none',
                background: 'rgba(239,159,39,0.05)',
                border: '1px solid rgba(239,159,39,0.18)',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              <span aria-hidden="true" style={{ color: '#ef9f27', fontWeight: 700, minWidth: 18 }}>{i + 1}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', color: '#FFF8EE', fontWeight: 600, fontSize: 16, lineHeight: 1.35 }}>
                  {it.title}
                </span>
                {it.author_name && (
                  <span style={{ display: 'block', color: '#8CA0B8', fontSize: 13, marginTop: 2 }}>{it.author_name}</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ol>
      <p style={{ margin: '12px 0 0' }}>
        <a href="/top" style={{ color: '#ef9f27', fontWeight: 700, textDecoration: 'none', fontFamily: "'Montserrat', sans-serif" }}>
          Усі рейтинги творів →
        </a>
      </p>
    </section>
  )
}
