// 01.11.2026: сторінка правила для учнів (/pravopys/uchnyam/apostrof) або сторінка класу (/pravopys/uchnyam/5-klas).
// SEO: власні title/description, H1 з ключовим запитом, перше речення з «українська мова, N клас, домашнє завдання».
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RULES, GRADES, bySlug, byGrade } from '@/lib/pravopys/data'
import { Shell, Crumbs, Tabs, Card, Label, H1, Lead, C, SERIF, IconTip, OkNo, Related, ReadCta, RuleLinkCard } from '../../ui'
import Quiz from '../../Quiz'
import { AlphabetGrid } from '../../Alphabet'

export const dynamicParams = false
export function generateStaticParams() {
  return [...RULES.map((r) => ({ slug: r.slug })), ...GRADES.map((g) => ({ slug: `${g}-klas` }))]
}
const gradeOf = (slug: string) => { const m = slug.match(/^(\d)-klas$/); return m ? Number(m[1]) : null }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const g = gradeOf(slug)
  if (g) return {
    title: `Українська мова ${g} клас: правила правопису з прикладами | Балабони`,
    description: `Правила правопису для ${g} класу з української мови: прості пояснення, підказки й мінітести. Допомога з домашнім завданням.`,
    alternates: { canonical: `/pravopys/uchnyam/${slug}` },
  }
  const r = bySlug(slug)
  if (!r) return {}
  return { title: r.pupil.title + ' | Балабони', description: r.pupil.description, alternates: { canonical: `/pravopys/uchnyam/${slug}` } }
}

export default async function UchnyamSlug({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const base = [{ name: 'Балабони', href: '/' }, { name: 'Правопис', href: '/pravopys' }, { name: 'Учням', href: '/pravopys/uchnyam' }]
  const g = gradeOf(slug)
  if (g) {
    const list = byGrade(g)
    return (
      <Shell>
        <Crumbs items={[...base, { name: `${g} клас`, href: `/pravopys/uchnyam/${slug}` }]} />
        <Tabs active="uchnyam" />
        <Card>
          <Label>Українська мова · {g} клас</Label>
          <H1>Українська мова, {g} клас: правила правопису</H1>
          <Lead>Правила правопису з української мови для {g} класу — простими словами, з підказками й мінітестами. Відкрий потрібне правило й виконай домашнє завдання без помилок.</Lead>
          <div style={{ display: 'grid', gap: 10 }}>{list.map((r) => <RuleLinkCard key={r.slug} r={r} audience="uchnyam" />)}</div>
          <p style={{ margin: '16px 0 0', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {GRADES.filter((x) => x !== g).map((x) => <a key={x} href={`/pravopys/uchnyam/${x}-klas`} style={{ color: C.NAVY, fontWeight: 700 }}>{x} клас</a>)}
          </p>
        </Card>
        <ReadCta />
      </Shell>
    )
  }
  const r = bySlug(slug)
  if (!r) notFound()
  const p = r.pupil
  return (
    <Shell>
      <Crumbs items={[...base, { name: `${r.grades[0]} клас`, href: `/pravopys/uchnyam/${r.grades[0]}-klas` }, { name: r.name, href: `/pravopys/uchnyam/${r.slug}` }]} />
      <Tabs active="uchnyam" slug={r.slug} />
      <Card>
        <Label>{r.grades.map((x) => x + ' клас').join(' · ')} · Українська мова</Label>
        <H1>{p.h1}</H1>
        <Lead>{p.lead}</Lead>
        <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '6px 0 8px' }}>Правило</h2>
        <p style={{ fontSize: 22, fontWeight: 600, color: C.NAVY, margin: '0 0 12px' }}>{p.rule}</p>
        {p.tip && (
          <div style={{ background: C.GOLD_BG, border: `2px dashed ${C.GOLD}`, borderRadius: 16, padding: '16px 20px', margin: '16px 0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <IconTip /><div><b style={{ color: C.NAVY }}>Підказка: </b>{p.tip}</div>
          </div>
        )}
        {r.extra === 'alphabet' && <AlphabetGrid />}
        <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '10px 0 0' }}>Правильно і неправильно</h2>
        <OkNo ok={p.ok} wrong={p.wrong} />
      </Card>
      <Quiz items={r.quiz} title={`Мінітест: ${r.name.toLowerCase()}`} />
      <Related rule={r} audience="uchnyam" />
      <ReadCta />
    </Shell>
  )
}
