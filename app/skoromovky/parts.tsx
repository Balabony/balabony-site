// 01.11.2026: спільні елементи розділу «Скоромовки» — фірмовий стиль Балабонів (як «Правопис»).
import type { ReactNode } from 'react'
import { C, SERIF, SANS, Card, IconTip } from '../pravopys/ui'
import { TEMY, type Skoromovka } from '@/lib/skoromovky-balabony'
import { KIDS_CONTEST } from '@/lib/kids-contest'

export function Page({ children }: { children: ReactNode }) {
  return (
    <main style={{ background: C.NAVY, minHeight: '100vh', padding: '40px 16px 96px', fontFamily: SANS, color: C.TEXT, fontSize: 20, lineHeight: 1.65 }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <a href="/" style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.GOLD, textDecoration: 'none' }}>Балабони</a>
        {children}
      </div>
    </main>
  )
}

export const H2 = ({ children, id }: { children: ReactNode; id?: string }) => (
  <h2 id={id} style={{ fontFamily: SERIF, fontSize: 28, color: C.NAVY, margin: '0 0 12px', lineHeight: 1.25, scrollMarginTop: 80 }}>{children}</h2>
)

export function List({ items, start = 1 }: { items: Skoromovka[]; start?: number }) {
  return (
    <ol start={start} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
      {items.map((s, i) => (
        <li key={s.t} style={{ background: '#fff', border: `1px solid ${C.BORDER}`, borderLeft: `6px solid ${C.GOLD}`, borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <span style={{ fontFamily: SERIF, fontWeight: 700, color: C.GOLD, fontSize: 18, minWidth: 28 }}>{start + i}.</span>
          <span style={{ whiteSpace: 'pre-line', fontSize: 21, fontWeight: 600, color: C.NAVY, lineHeight: 1.5 }}>{s.t}</span>
        </li>
      ))}
    </ol>
  )
}

export function Chips({ active }: { active?: string }) {
  return (
    <nav aria-label="Рубрики скоромовок" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '4px 0 0' }}>
      <a href="/skoromovky" style={chip(!active)}>Усі скоромовки</a>
      {TEMY.map((t) => <a key={t.slug} href={`/skoromovky/${t.slug}`} style={chip(active === t.slug)}>{t.name}</a>)}
    </nav>
  )
}
function chip(on: boolean) {
  return { padding: '7px 14px', borderRadius: 999, fontSize: 15, fontWeight: 700, textDecoration: 'none', background: on ? C.GOLD : '#fff', color: C.NAVY, border: `1.5px solid ${on ? C.GOLD : C.BORDER}` } as const
}

export function Tip({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: C.GOLD_BG, border: `2px dashed ${C.GOLD}`, borderRadius: 16, padding: '14px 18px', margin: '16px 0 0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <IconTip />
      <div>{children}</div>
    </div>
  )
}

export function ContestCta() {
  return (
    <section style={{ background: `radial-gradient(120% 120% at 100% 0%, rgba(250,199,117,0.30) 0%, rgba(0,0,0,0) 60%), #14253B`, border: `2px solid ${C.GOLD}`, borderRadius: 22, padding: '24px 24px 26px', margin: '0 0 24px', color: '#f8fafc' }}>
      <span style={{ display: 'inline-block', fontSize: 13, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.NAVY, background: C.GOLD, padding: '5px 12px', borderRadius: 8 }}>Конкурс для дітей · 1–11 клас</span>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, color: '#fff', margin: '12px 0 8px', lineHeight: 1.25 }}>Придумай власну скоромовку — і вигравай книжки</h2>
      <p style={{ margin: '0 0 16px', color: '#dbe4f0' }}>Всеукраїнський конкурс {KIDS_CONTEST.title}: прийом робіт з {KIDS_CONTEST.startText} до {KIDS_CONTEST.endText}. Переможцям — книжки українських письменників і цифрові дипломи, усім — цифрові сертифікати. Обов’язкова реєстрація: зверніться до батьків або педагогів — вони допоможуть.</p>
      <a href={KIDS_CONTEST.path} style={{ display: 'inline-block', background: C.GOLD, color: C.NAVY, fontWeight: 800, padding: '12px 22px', borderRadius: 999, textDecoration: 'none', fontSize: 18 }}>Умови конкурсу →</a>
    </section>
  )
}

export function MoreLinks() {
  return (
    <Card>
      <H2>Ще для розвитку мовлення</H2>
      <ul style={{ margin: 0, paddingLeft: 22 }}>
        <li><a href="/zahadky" style={{ color: C.NAVY, fontWeight: 700 }}>Загадки з відповідями</a> — для дітей і всієї родини</li>
        <li><a href="/pravopys/uchnyam" style={{ color: C.NAVY, fontWeight: 700 }}>Правопис для учнів 5–9 класу</a> — правила з прикладами й тестами</li>
        <li><a href="/fairytales" style={{ color: C.NAVY, fontWeight: 700 }}>Казки на ніч українською</a> — читати й слухати</li>
        <li><a href="/games" style={{ color: C.NAVY, fontWeight: 700 }}>Ігри для мозку</a> — пам’ять, увага, логіка</li>
      </ul>
    </Card>
  )
}
