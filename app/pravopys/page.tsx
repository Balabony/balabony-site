// 01.11.2026 (Богдан): головна розділу «Правопис» — вибір «Учням» / «Студентам». SEO: «правопис української мови 2026».
import type { Metadata } from 'next'
import { RULES, SOURCE_PDF } from '@/lib/pravopys/data'
import { Shell, Crumbs, Card, Label, H1, Lead, C, SERIF, IconYes } from './ui'

export const metadata: Metadata = {
  title: 'Правопис української мови 2026: правила з прикладами для учнів і студентів | Балабони',
  description: 'Правопис української мови 2026 простими словами: український алфавіт, апостроф, м’який знак, не з дієсловами, велика буква, кома. Окремо для учнів 5–9 класів і для студентів, з тестами.',
  alternates: { canonical: '/pravopys' },
}

export default function PravopysHub() {
  const big = (href: string, title: string, sub: string) => (
    <a href={href} style={{ display: 'block', background: C.GOLD, color: C.NAVY, borderRadius: 20, padding: '22px 24px', textDecoration: 'none' }}>
      <span style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, display: 'block' }}>{title}</span>
      <span style={{ fontSize: 18, fontWeight: 600 }}>{sub}</span>
    </a>
  )
  return (
    <Shell>
      <Crumbs items={[{ name: 'Балабони', href: '/' }, { name: 'Правопис', href: '/pravopys' }]} />
      <Card>
        <Label>Український правопис 2026</Label>
        <H1>Правопис української мови: правила з прикладами</H1>
        <Lead>Правопис української мови 2026 простими словами: кожне правило з прикладами, типовими помилками й тестом «Перевір себе». Окремо для учнів — до домашнього завдання з української мови, і для студентів — до сесії та НМТ.</Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, margin: '8px 0 18px' }}>
          {big('/pravopys/uchnyam', 'Учням', 'Прості правила, підказки, мінітести · 5–9 клас')}
          {big('/pravopys/studentam', 'Студентам', 'Повні правила з § стандарту · НМТ')}
        </div>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '18px 0 10px' }}>Що змінилося в правописі 2026</h2>
        <p style={{ margin: '0 0 10px', display: 'flex', gap: 12 }}><IconYes />Норми правопису 2019 року не змінилися. Стандарт 2026 уточнив формулювання, виправив помилки, змінив нумерацію параграфів і додав підрозділ «Український алфавіт»: <a href="/pravopys/uchnyam/alfavit" style={{ color: C.NAVY, fontWeight: 700 }}>абетка для учнів</a> і <a href="/pravopys/studentam/alfavit" style={{ color: C.NAVY, fontWeight: 700 }}>таблиця з назвами букв для студентів</a>.</p>
        <p style={{ margin: 0 }}><a href={SOURCE_PDF} target="_blank" rel="noopener" style={{ color: C.NAVY, fontWeight: 700 }}>Завантажити офіційний текст правопису (PDF, mova.gov.ua) →</a></p>
      </Card>
      <Card>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '0 0 10px' }}>Усі правила</h2>
        <ul style={{ margin: 0, paddingLeft: 22, columns: '2 260px' }}>
          {RULES.map((r) => <li key={r.slug} style={{ margin: '4px 0' }}><a href={`/pravopys/studentam/${r.slug}`} style={{ color: C.NAVY, fontWeight: 700 }}>{r.name}</a></li>)}
        </ul>
      </Card>
    </Shell>
  )
}
