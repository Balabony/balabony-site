// 16.11.2026 (Богдан): «Афіша без барʼєрів» на головній — три найближчі позиції й посилання на всю афішу.
import Link from 'next/link'
import { ACCESS_LABEL } from '@/lib/afisha'
import { AccessIcon } from '../afisha/AfishaArt'
import type { TeaserItem } from '@/lib/afisha-teaser'

const GOLD = '#ef9f27'
const CREAM = '#f5f0e8'

export default function AfishaTeaser({ items }: { items: TeaserItem[] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="afisha-home-h" style={{ background: '#0a1628', padding: '36px 20px', fontFamily: "'Montserrat', Arial, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 800, letterSpacing: 2, color: GOLD, textTransform: 'uppercase' }}>Культура для всіх</p>
            <h2 id="afisha-home-h" style={{ margin: 0, fontSize: 'clamp(24px,3.4vw,32px)', fontWeight: 800, color: CREAM }}>Афіша без барʼєрів</h2>
            <p style={{ margin: '6px 0 0', color: '#c9d4e4', fontSize: 15.5 }}>Кіно й вистави з аудіодескрипцією, субтитрами та жестовою мовою по всій Україні.</p>
          </div>
          <Link href="/afisha" style={{ color: '#1a1206', background: GOLD, fontWeight: 800, fontSize: 15, padding: '10px 18px', borderRadius: 99, textDecoration: 'none' }}>Вся афіша →</Link>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {items.map((it) => (
            <li key={it.title + it.when}>
              <Link href="/afisha" style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', boxSizing: 'border-box', background: 'linear-gradient(180deg,#12244a,#0f1e3a)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, padding: 18, textDecoration: 'none' }}>
                <span style={{ color: GOLD, fontWeight: 700, fontSize: 13.5, textTransform: 'uppercase', letterSpacing: .5 }}>{it.label} · {it.when}</span>
                <span style={{ color: CREAM, fontWeight: 800, fontSize: 19, lineHeight: 1.3 }}>{it.title}</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
                  {it.access.map((a) => <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, padding: '4px 10px 4px 8px', borderRadius: 99, background: 'rgba(239,159,39,0.14)', color: GOLD }}><AccessIcon a={a} size={14} />{ACCESS_LABEL[a]}</span>)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
