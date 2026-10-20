import { workPath } from '@/lib/rss'
import type { FeaturedAuthor as FA } from '@/lib/featured-author'

/** «Знайомтеся: автор тижня» — фото, кілька слів про автора й посилання на твори (21.10.2026). */
export default function FeaturedAuthor({ a }: { a: FA | null }) {
  if (!a) return null
  return (
    <section aria-labelledby="featured-author-title" style={{ maxWidth: 1000, margin: '0 auto', padding: '8px 20px 28px' }}>
      <h2 id="featured-author-title" style={{ fontFamily: "'Comfortaa', sans-serif", fontSize: 'clamp(19px, 4.6vw, 24px)', fontWeight: 700, color: '#FAC775', margin: '0 0 12px' }}>
        Знайомтеся: автор тижня
      </h2>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start', padding: 18, borderRadius: 14, background: 'rgba(239,159,39,0.05)', border: '1px solid rgba(239,159,39,0.25)', fontFamily: "'Montserrat', sans-serif" }}>
        {a.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.avatar} alt={a.name} width={112} height={112} loading="lazy" style={{ width: 112, height: 112, borderRadius: '50%', objectFit: 'cover', border: '2px solid #C08A2E', flex: 'none' }} />
        )}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <p style={{ margin: 0 }}>
            <a href={`/avtor/${a.slug}`} style={{ color: '#ef9f27', fontWeight: 700, fontSize: 22, textDecoration: 'none', fontFamily: "'Comfortaa', sans-serif" }}>{a.name}</a>
          </p>
          <p style={{ margin: '2px 0 8px', color: '#8CA0B8', fontSize: 14 }}>{a.total} {tvoriv(a.total)} на Балабонах</p>
          {a.bio && <p style={{ margin: 0, color: '#D9DEE8', fontSize: 15, lineHeight: 1.6 }}>{a.bio}</p>}
          {a.works.length > 0 && (
            <>
              <p style={{ margin: '14px 0 6px', color: '#FAC775', fontWeight: 700, fontSize: 14 }}>Почніть із цих творів:</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' }}>
                {a.works.map((w) => (
                  <li key={w.slug}>
                    <a href={workPath(w.type, w.slug)} style={{ display: 'block', padding: '10px 12px', borderRadius: 10, textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,159,39,0.18)', color: '#FFF8EE', fontWeight: 600, fontSize: 15, lineHeight: 1.35 }}>
                      {w.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p style={{ margin: '14px 0 0' }}>
            <a href={`/avtor/${a.slug}`} style={{ color: '#ef9f27', fontWeight: 700, textDecoration: 'none' }}>Усі твори автора →</a>
          </p>
        </div>
      </div>
    </section>
  )
}

function tvoriv(n: number): string {
  const d = n % 10, h = n % 100
  if (d === 1 && h !== 11) return 'твір'
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'твори'
  return 'творів'
}
