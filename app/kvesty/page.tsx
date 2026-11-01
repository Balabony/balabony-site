// 01.11.2026: «Квести для дітей онлайн» — список квестів від редакції Балабонів.
import type { Metadata } from 'next'
import { C, Card, Label, H1, Lead, Crumbs, FaqLd } from '../pravopys/ui'
import { KVESTY } from '@/lib/kvesty'
import { Page, H2, Tip, ContestCta, MoreLinks } from '../skoromovky/parts'

const TITLE = 'Квести для дітей онлайн українською — безкоштовно | Балабони'
const DESC = 'Квести для дітей онлайн українською: новорічний, осінній і квест з української мови. Загадки, скоромовки, правопис — для дітей 5–11 років. Цифровий диплом наприкінці.'

export const metadata: Metadata = {
  title: TITLE, description: DESC,
  alternates: { canonical: 'https://balabony.com/kvesty' },
  openGraph: { images: ['https://balabony.com/og-image-v6.jpg'], title: TITLE, description: DESC, url: 'https://balabony.com/kvesty', type: 'website' },
}

const FAQ = [
  { q: 'Скільки триває квест?', a: 'Від 8 до 10 хвилин. Кожен квест — це коротка історія з загадками, вибором шляху, скоромовкою й завданнями з української мови.' },
  { q: 'Для якого віку квести?', a: 'Для дітей 5–11 років. Біля кожного квесту вказано вік. Молодшим дітям допоможуть батьки — читати разом навіть веселіше.' },
  { q: 'Як отримати диплом?', a: 'Наприкінці квесту дитина отримує цифровий диплом «Мандрівник Балабонів». Для диплома потрібна реєстрація на Балабонах — зверніться до батьків або педагогів, вони допоможуть.' },
  { q: 'Чи можна проводити квест на уроці?', a: 'Так. Вчитель може вивести квест на екран і проходити його всім класом: діти відгадують загадки хором і разом обирають шлях.' },
]

export default function Kvesty() {
  return (
    <Page>
      <Crumbs items={[{ name: 'Балабони', href: '/' }, { name: 'Квести для дітей', href: '/kvesty' }]} />
      <div style={{ height: 18 }} />
      <Card>
        <Label>Від редакції Балабонів · 5–11 років</Label>
        <H1>Квести для дітей онлайн</H1>
        <Lead><b style={{ color: C.NAVY }}>Квести для дітей онлайн українською</b> — короткі пригоди на 10 хвилин: загадки, скоромовки, правопис і вибір шляху. Наприкінці — цифровий диплом «Мандрівник Балабонів».</Lead>
        <Tip>Проходьте квест разом: дорослий читає історію, дитина відгадує загадки й обирає, куди йти. Так квест стає ще й читанням уголос.</Tip>
      </Card>

      {KVESTY.map((k) => (
        <a key={k.slug} href={`/kvesty/${k.slug}`} style={{ display: 'block', textDecoration: 'none', background: `radial-gradient(120% 120% at 100% 0%, rgba(250,199,117,0.28) 0%, rgba(0,0,0,0) 60%), #14253B`, border: `2px solid ${C.GOLD}`, borderRadius: 20, padding: '22px 22px 20px', margin: '0 0 18px', color: '#f8fafc' }}>
          <span style={{ display: 'inline-block', fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.NAVY, background: C.GOLD, padding: '4px 10px', borderRadius: 8 }}>{k.age} · {k.minutes} хв</span>
          <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#fff', margin: '10px 0 6px' }}>{k.title}</div>
          <div style={{ color: '#dbe4f0', fontSize: 18 }}>{k.lead}</div>
          <div style={{ marginTop: 12, fontWeight: 800, color: C.GOLD }}>Почати квест →</div>
        </a>
      ))}

      <ContestCta />
      <Card>
        <H2>Питання й відповіді</H2>
        {FAQ.map((f) => (
          <div key={f.q} style={{ margin: '0 0 14px' }}>
            <h3 style={{ fontSize: 20, color: C.NAVY, margin: '0 0 4px' }}>{f.q}</h3>
            <p style={{ margin: 0 }}>{f.a}</p>
          </div>
        ))}
      </Card>
      <MoreLinks />
      <FaqLd faq={FAQ} />
    </Page>
  )
}
