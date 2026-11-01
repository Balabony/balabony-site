// 01.11.2026: сторінка одного квесту.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { C, Card, Label, H1, Crumbs } from '../../pravopys/ui'
import { KVESTY, findKvest } from '@/lib/kvesty'
import { Page, H2, ContestCta, MoreLinks } from '../../skoromovky/parts'
import Player from '../Player'

export function generateStaticParams() {
  return KVESTY.map((k) => ({ slug: k.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const k = findKvest((await params).slug)
  if (!k) return {}
  const title = `Квест «${k.title}» для дітей ${k.age} — онлайн | Балабони`
  const url = `https://balabony.com/kvesty/${k.slug}`
  return { title, description: k.description, alternates: { canonical: url }, openGraph: { title, description: k.description, url, type: 'website' } }
}

export default async function KvestPage({ params }: { params: Promise<{ slug: string }> }) {
  const k = findKvest((await params).slug)
  if (!k) notFound()
  const others = KVESTY.filter((x) => x.slug !== k.slug)
  return (
    <Page>
      <style dangerouslySetInnerHTML={{ __html: '@media print { body * { visibility: hidden !important; } #diploma, #diploma * { visibility: visible !important; } #diploma { position: absolute; left: 0; top: 0; width: 100%; } }' }} />
      <Crumbs items={[{ name: 'Балабони', href: '/' }, { name: 'Квести для дітей', href: '/kvesty' }, { name: k.title, href: `/kvesty/${k.slug}` }]} />
      <div style={{ height: 18 }} />
      <Card>
        <Label>Квест для дітей · {k.age} · {k.minutes} хв</Label>
        <H1>Квест «{k.title}»</H1>
        <p style={{ margin: '0 0 16px', fontSize: 18, color: C.MUTED }}>Від редакції Балабонів. Загадки, скоромовка й завдання з української мови — і цифровий диплом наприкінці.</p>
        <Player k={k} />
      </Card>
      <Card>
        <H2>Інші квести</H2>
        <ul style={{ margin: 0, paddingLeft: 22 }}>
          {others.map((o) => <li key={o.slug}><a href={`/kvesty/${o.slug}`} style={{ color: C.NAVY, fontWeight: 700 }}>{o.title}</a> — {o.age}</li>)}
          <li><a href="/skoromovky" style={{ color: C.NAVY, fontWeight: 700 }}>Скоромовки для дітей</a></li>
        </ul>
      </Card>
      <ContestCta />
      <MoreLinks />
    </Page>
  )
}
