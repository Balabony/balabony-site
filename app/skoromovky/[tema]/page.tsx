// 01.11.2026: рубрика скоромовок — окрема сторінка під кожен пошуковий запит («скоромовки на звук р», «скоромовки для 2 класу»…).
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { C, Card, Label, H1, Lead, Crumbs } from '../../pravopys/ui'
import { TEMY, byTema, findTema, sk } from '@/lib/skoromovky-balabony'
import { Page, H2, List, Chips, Tip, ContestCta, MoreLinks } from '../parts'

export function generateStaticParams() {
  return TEMY.map((t) => ({ tema: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ tema: string }> }): Promise<Metadata> {
  const t = findTema((await params).tema)
  if (!t) return {}
  const url = `https://balabony.com/skoromovky/${t.slug}`
  return { title: t.title, description: t.description, alternates: { canonical: url }, openGraph: { title: t.title, description: t.description, url, type: 'website' } }
}

export default async function TemaPage({ params }: { params: Promise<{ tema: string }> }) {
  const t = findTema((await params).tema)
  if (!t) notFound()
  const items = byTema(t.slug)
  const others = TEMY.filter((x) => x.slug !== t.slug)
  return (
    <Page>
      <Crumbs items={[{ name: 'Балабони', href: '/' }, { name: 'Скоромовки', href: '/skoromovky' }, { name: t.name, href: `/skoromovky/${t.slug}` }]} />
      <div style={{ height: 18 }} />
      <Card>
        <Label>Скоромовки українською · {items.length}</Label>
        <H1>{t.h1}</H1>
        <Lead>{t.lead}</Lead>
        <Tip>{t.tip}</Tip>
      </Card>
      <Card>
        <H2>{t.h1}: {sk(items.length)}</H2>
        <List items={items} />
      </Card>
      <ContestCta />
      <Card>
        <H2>Інші скоромовки</H2>
        <Chips active={t.slug} />
        <p style={{ margin: '14px 0 0', fontSize: 17 }}>
          Найпопулярніші: {others.slice(0, 4).map((o, i) => (
            <span key={o.slug}>{i > 0 && ' · '}<a href={`/skoromovky/${o.slug}`} style={{ color: C.NAVY, fontWeight: 700 }}>{o.h1.toLowerCase()}</a></span>
          ))}
        </p>
      </Card>
      <MoreLinks />
    </Page>
  )
}
