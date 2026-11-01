// 01.11.2026: розділ «Студентам» — правила за розділами стандарту з номерами §; плюс раніше вивірені статті з бази (spelling_rules).
import type { Metadata } from 'next'
import { RULES, sections } from '@/lib/pravopys/data'
import { dbQuery } from '@/lib/db'
import { Shell, Crumbs, Tabs, Card, Label, H1, Lead, C, SERIF, RuleLinkCard, ReadCta, RuleItem } from '../ui'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Правопис української мови для студентів і НМТ: правила з § стандарту 2026 | Балабони',
  description: 'Правопис для студентів і підготовки до НМТ з української мови: правила за розділами чинного стандарту 2026 з номерами параграфів, прикладами, типовими помилками й тестами.',
  alternates: { canonical: '/pravopys/studentam' },
}

type DbRule = { id: number; topic: string; category: string | null; rule_short: string; examples: string | null }
async function dbRules(): Promise<DbRule[]> {
  try {
    const res = await dbQuery(`SELECT id, topic, category, rule_short, examples FROM spelling_rules WHERE status = 'verified' AND audience = 'all' ORDER BY category NULLS LAST, sort_order ASC, topic ASC`)
    return res.rows as DbRule[]
  } catch { return [] }
}

export default async function Studentam() {
  const extra = await dbRules()
  return (
    <Shell>
      <Crumbs items={[{ name: 'Балабони', href: '/' }, { name: 'Правопис', href: '/pravopys' }, { name: 'Студентам', href: '/pravopys/studentam' }]} />
      <Tabs active="studentam" />
      <Card>
        <Label>Сесія · НМТ з української мови</Label>
        <H1>Правопис для студентів і НМТ</H1>
        <Lead>Правопис української мови для студентів і підготовки до НМТ: правила за розділами чинного стандарту 2026, з номерами параграфів, прикладами, типовими помилками й тестом після кожного правила.</Lead>
      </Card>
      {sections().map((s) => (
        <Card key={s}>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '0 0 12px' }}>{s}</h2>
          <div style={{ display: 'grid', gap: 10 }}>{RULES.filter((r) => r.section === s).map((r) => <RuleLinkCard key={r.slug} r={r} audience="studentam" />)}</div>
        </Card>
      ))}
      {extra.length > 0 && (
        <Card>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '0 0 12px' }}>Ще правила: запозичені слова й варіантні форми</h2>
          {extra.map((r) => (
            <div key={r.id} style={{ margin: '0 0 14px' }}>
              <h3 style={{ fontSize: 21, color: C.NAVY, margin: '0 0 4px' }}>{r.topic}</h3>
              <p style={{ margin: '0 0 6px' }}>{r.rule_short}</p>
              {r.examples && <RuleItem it={{ t: 'Приклади', ex: r.examples }} kind="info" />}
            </div>
          ))}
        </Card>
      )}
      <ReadCta />
    </Shell>
  )
}
