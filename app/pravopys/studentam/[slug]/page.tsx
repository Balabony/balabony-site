// 01.11.2026: сторінка правила для студентів (/pravopys/studentam/apostrof): повне правило з § стандарту, типові помилки, FAQ, тест.
// SEO: власні title/description, H1 з ключовим запитом, перше речення з ключовими словами, розмітка FAQPage і BreadcrumbList.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RULES, bySlug, SOURCE_URL } from '@/lib/pravopys/data'
import { Shell, Crumbs, Tabs, Card, Label, H1, Lead, C, SERIF, IconYes, IconNo, IconTip, RuleItem, OkNo, Related, ReadCta, FaqLd } from '../../ui'
import Quiz from '../../Quiz'
import { AlphabetTable } from '../../Alphabet'

export const dynamicParams = false
export function generateStaticParams() { return RULES.map((r) => ({ slug: r.slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const r = bySlug(slug)
  if (!r) return {}
  return { title: r.student.title + ' | Балабони', description: r.student.description, alternates: { canonical: `/pravopys/studentam/${slug}` } }
}

export default async function StudentamSlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const r = bySlug(slug)
  if (!r) notFound()
  const s = r.student
  const icon = (k: 'yes' | 'no' | 'info') => (k === 'yes' ? <IconYes /> : k === 'no' ? <IconNo /> : <IconTip />)
  return (
    <Shell>
      <Crumbs items={[{ name: 'Балабони', href: '/' }, { name: 'Правопис', href: '/pravopys' }, { name: 'Студентам', href: '/pravopys/studentam' }, { name: r.name, href: `/pravopys/studentam/${r.slug}` }]} />
      <Tabs active="studentam" slug={r.slug} />
      <Card>
        <Label>{r.section} · {r.para}</Label>
        <H1>{s.h1}</H1>
        <Lead>{s.lead}</Lead>
        {r.extra === 'alphabet' && <AlphabetTable />}
        {s.blocks.map((b, i) => (
          <div key={i}>
            <h2 style={{ fontSize: 23, color: C.NAVY, margin: '22px 0 8px', display: 'flex', alignItems: 'center', gap: 10 }}>{icon(b.kind)}{b.h}</h2>
            {b.items.map((it, j) => <RuleItem key={j} it={it} kind={b.kind} />)}
          </div>
        ))}
        <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '24px 0 0' }}>Типові помилки</h2>
        <OkNo ok={s.mistakes.map((m) => m.right)} wrong={s.mistakes.map((m) => m.wrong)} />
        <p style={{ fontSize: 15, color: C.MUTED, margin: '10px 0 0' }}>Джерело: «Український правопис», {r.para} · <a href={SOURCE_URL} target="_blank" rel="noopener" style={{ color: C.MUTED }}>рішення Комісії № 47 від 01.03.2026</a></p>
      </Card>
      <Quiz items={r.quiz} title="Перевір себе" />
      <Card>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '0 0 10px' }}>Питання й відповіді</h2>
        {s.faq.map((f, i) => (
          <div key={i} style={{ margin: '0 0 12px' }}>
            <h3 style={{ fontSize: 21, color: C.NAVY, margin: '0 0 4px' }}>{f.q}</h3>
            <p style={{ margin: 0 }}>{f.a}</p>
          </div>
        ))}
        <FaqLd faq={s.faq} />
      </Card>
      <Related rule={r} audience="studentam" />
      <ReadCta />
    </Shell>
  )
}
