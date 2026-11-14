// 01.11.2026: розділ «Учням» — правила за класами (5–9). SEO: «правопис для учнів», «українська мова 5 клас».
import type { Metadata } from 'next'
import { RULES, GRADES, byGrade } from '@/lib/pravopys/data'
import { Shell, Crumbs, Tabs, Card, Label, H1, Lead, C, SERIF, RuleLinkCard, ReadCta } from '../ui'

export const metadata: Metadata = {
  title: 'Правопис для учнів: правила української мови 5–9 клас з прикладами | Балабони',
  description: 'Правила української мови для учнів 5–9 класів: українська абетка, апостроф, м’який знак, велика буква, не з дієсловами. Прості пояснення, підказки й мінітести для домашнього завдання.',
  alternates: { canonical: '/pravopys/uchnyam' },
}

export default function Uchnyam() {
  return (
    <Shell>
      <Crumbs items={[{ name: 'Балабони', href: '/' }, { name: 'Правопис', href: '/pravopys' }, { name: 'Учням', href: '/pravopys/uchnyam' }]} />
      <Tabs active="uchnyam" />
      <Card>
        <Label>Українська мова · 5–9 клас</Label>
        <H1>Правопис для учнів: правила з прикладами</H1>
        <Lead>Правила української мови для учнів 5–9 класів простими словами: кожне з підказкою-запам’ятовувалкою, прикладами й мінітестом. Обери свій клас — і виконай домашнє завдання без помилок.</Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {GRADES.map((g) => <a key={g} href={`/pravopys/uchnyam/${g}-klas`} style={{ background: C.GOLD, color: C.NAVY, fontWeight: 800, padding: '10px 18px', borderRadius: 999, textDecoration: 'none', fontSize: 18 }}>{g} клас</a>)}
        </div>
      </Card>
      {GRADES.map((g) => byGrade(g).length > 0 && (
        <Card key={g}>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '0 0 12px' }}><a href={`/pravopys/uchnyam/${g}-klas`} style={{ color: C.NAVY }}>Українська мова, {g} клас: правила правопису</a></h2>
          <div style={{ display: 'grid', gap: 10 }}>{byGrade(g).map((r) => <RuleLinkCard key={r.slug} r={r} audience="uchnyam" />)}</div>
        </Card>
      ))}
      <p style={{ color: C.LIGHT, fontSize: 15 }}>Усього правил: {RULES.length}. Клас указано орієнтовно — тему можуть вивчати й в інших класах.</p>
      <ReadCta />
    </Shell>
  )
}
