// 01.11.2026: «Скоромовки українською» — головна сторінка розділу: усі рубрики, поради, конкурс, FAQ (SEO: «скоромовки», ~10 тис. пошуків/міс).
import type { Metadata } from 'next'
import { C, Card, Label, H1, Lead, Crumbs, FaqLd } from '../pravopys/ui'
import { TEMY, SKOROMOVKY, byTema, sk } from '@/lib/skoromovky-balabony'
import { Page, H2, List, Chips, Tip, ContestCta, MoreLinks } from './parts'

const N = SKOROMOVKY.length
const TITLE = 'Скоромовки українською для дітей і дорослих — ' + sk(N) + ' | Балабони'
const DESC = `${sk(N)} українською: для дітей і дорослих, на звуки Р, Л, Ш, С, Ж, для дошкільнят, 1 і 2 класу, для дикції, про зиму й осінь, смішні й складні. Поради, як тренуватися.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://balabony.com/skoromovky' },
  openGraph: { title: TITLE, description: DESC, url: 'https://balabony.com/skoromovky', type: 'website' },
}

const FAQ = [
  { q: 'Навіщо дітям скоромовки?', a: 'Скоромовки тренують артикуляцію, чітку вимову звуків, швидкість мовлення й пам’ять. Логопеди радять їх для закріплення звуків Р, Л, Ш, С, Ж.' },
  { q: 'Як правильно вчити скоромовку?', a: 'Спершу повільно й чітко, по складах. Потім тричі поспіль у звичайному темпі без запинок. Лише тоді — швидше. Швидкість без чіткості нічого не тренує.' },
  { q: 'Чи корисні скоромовки дорослим?', a: 'Так. Скоромовки для дикції — найпростіша розминка перед виступом, уроком, ефіром чи важливою розмовою.' },
  { q: 'Чи можна придумати власну скоромовку?', a: 'Так! Візьміть 2–3 схожі звуки й складіть з ними коротку смішну історію. А ще можна взяти участь у дитячому конкурсі «Скоромовка Балабонів».' },
]

export default function Skoromovky() {
  const itemLd = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'Скоромовки українською',
    numberOfItems: N,
    itemListElement: TEMY.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.h1, url: `https://balabony.com/skoromovky/${t.slug}` })),
  }
  return (
    <Page>
      <Crumbs items={[{ name: 'Балабони', href: '/' }, { name: 'Скоромовки', href: '/skoromovky' }]} />
      <div style={{ height: 18 }} />
      <Card>
        <Label>Для дітей і дорослих · {sk(N)}</Label>
        <H1>Скоромовки українською для дітей і дорослих</H1>
        <Lead><b style={{ color: C.NAVY }}>Скоромовки українською</b> — {sk(N)}: народні й авторські, для дітей і дорослих — для розвитку мовлення, дикції та гарного настрою.</Lead>
        <p style={{ margin: '0 0 14px' }}>Тут є <b style={{ color: C.NAVY }}>скоромовки для дітей</b> на звуки Р, Л, Ш, С і Ж, для дошкільнят, 1 і 2 класу, <b style={{ color: C.NAVY }}>скоромовки для дикції</b> дорослим, про зиму й осінь, смішні, короткі й найскладніші. Оберіть рубрику:</p>
        <Chips />
      </Card>

      <Card>
        <H2>Як тренуватися зі скоромовками</H2>
        <ol style={{ margin: 0, paddingLeft: 24 }}>
          <li>Прочитайте скоромовку повільно й чітко, по складах.</li>
          <li>Повторіть тричі поспіль у звичайному темпі — без запинок.</li>
          <li>Лише тоді пришвидшуйтеся. Швидкість без чіткості нічого не тренує.</li>
          <li>Дитині покажіть, як рухаються губи й язик, — і проговорюйте разом.</li>
        </ol>
        <Tip>Дорослим скоромовки допомагають розім’яти мовлення зранку чи перед виступом: 2–3 складні скоромовки — і голос звучить чіткіше.</Tip>
      </Card>

      {TEMY.map((t, i) => {
        const items = byTema(t.slug)
        return (
          <div key={t.slug}>
            <Card id={t.slug}>
              <H2>{t.h1}</H2>
              <p style={{ margin: '0 0 14px' }}>{t.lead}</p>
              <List items={items.slice(0, 4)} />
              <p style={{ margin: '14px 0 0' }}>
                <a href={`/skoromovky/${t.slug}`} style={{ color: C.NAVY, fontWeight: 800 }}>{t.name}: усі {sk(items.length)} →</a>
              </p>
            </Card>
            {i === 3 && <ContestCta />}
          </div>
        )
      })}

      <Card>
        <H2>Питання й відповіді про скоромовки</H2>
        {FAQ.map((f) => (
          <div key={f.q} style={{ margin: '0 0 14px' }}>
            <h3 style={{ fontSize: 20, color: C.NAVY, margin: '0 0 4px' }}>{f.q}</h3>
            <p style={{ margin: 0 }}>{f.a}</p>
          </div>
        ))}
      </Card>
      <MoreLinks />
      <FaqLd faq={FAQ} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemLd) }} />
    </Page>
  )
}
