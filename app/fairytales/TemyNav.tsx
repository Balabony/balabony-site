// 01.11.2026: плашки тематичних добірок казок — на /fairytales і на кожній добірці.
import Link from 'next/link'
import { KAZKY_TEMY } from '@/lib/kazky-temy'

export default function TemyNav({ active }: { active?: string }) {
  const chip = (on: boolean) => ({
    padding: '8px 16px', borderRadius: 999, fontSize: 15, fontWeight: 700, textDecoration: 'none',
    background: on ? '#FAC775' : 'transparent', color: on ? '#0f172a' : '#FAC775', border: '1.5px solid #FAC775',
  } as const)
  return (
    <nav aria-label="Добірки казок" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 24px' }}>
      <Link href="/fairytales" style={chip(!active)}>Усі казки</Link>
      {KAZKY_TEMY.map((t) => (
        <Link key={t.slug} href={`/fairytales/${t.slug}`} style={chip(active === t.slug)}>{t.name}</Link>
      ))}
    </nav>
  )
}
