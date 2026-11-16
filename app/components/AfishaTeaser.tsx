// 16.11.2026 (Богдан): «Афіша без барʼєрів» на головній — компактна смуга вгорі, без зайвого:
// назва рубрики, до 3 найближчих позицій одним рядком і посилання на всю афішу.
import Link from 'next/link'
import type { TeaserItem } from '@/lib/afisha-teaser'

const GOLD = '#ef9f27'
const CREAM = '#f5f0e8'

export default function AfishaTeaser({ items }: { items: TeaserItem[] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="afisha-home-h" style={{ background: '#0a1628', padding: '12px 20px', fontFamily: "'Montserrat', Arial, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px' }}>
        <h2 id="afisha-home-h" style={{ margin: 0, fontSize: 15, fontWeight: 800, color: GOLD, whiteSpace: 'nowrap' }}>Афіша без барʼєрів:</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '6px 16px', flex: '1 1 auto' }}>
          {items.map((it) => (
            <li key={it.title + it.when} style={{ fontSize: 14, color: CREAM, lineHeight: 1.4 }}>
              <strong>{it.title}</strong> <span style={{ color: '#9fb0c8' }}>— {it.when}</span>
            </li>
          ))}
          <li style={{ fontSize: 14, lineHeight: 1.4 }}><Link href="/afisha" style={{ color: GOLD, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>Вся афіша →</Link></li>
        </ul>
      </div>
    </section>
  )
}
