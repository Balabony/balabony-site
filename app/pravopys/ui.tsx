// 01.11.2026: спільні елементи розділу «Правопис» (Учням / Студентам) — фірмовий стиль Балабонів:
// темно-синій фон, кремові картки, золотий акцент, Lora + Montserrat, власні значки замість емодзі,
// великий кегль. Червоного кольору в бренді немає: «помилка» — темно-синя з закресленням.
import type { ReactNode } from 'react'
import { RULES, SOURCE_URL, type Rule, type Item } from '@/lib/pravopys/data'

export const C = { NAVY: '#0f172a', CARD: '#f8fafc', GOLD: '#ef9f27', GOLD_BG: '#fff7e8', TEXT: '#1e293b', MUTED: '#64748b', BORDER: '#e2e8f0', HL: '#fef08a', LIGHT: '#aab8cc' }
export const SERIF = "'Lora', Georgia, serif"
export const SANS = "'Montserrat', Arial, sans-serif"
export const BASE = 'https://balabony.com'

export function IconYes({ size = 32 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true" style={{ flex: '0 0 auto' }}><circle cx="17" cy="17" r="16" fill={C.GOLD} /><path d="M10 17.5l4.5 4.5L24 12" stroke={C.NAVY} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>)
}
export function IconNo({ size = 32 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true" style={{ flex: '0 0 auto' }}><circle cx="17" cy="17" r="16" fill={C.NAVY} /><path d="M11.5 11.5l11 11M22.5 11.5l-11 11" stroke={C.GOLD} strokeWidth="3.2" strokeLinecap="round" /></svg>)
}
export function IconTip({ size = 32 }: { size?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true" style={{ flex: '0 0 auto' }}><path d="M17 3a10 10 0 0 0-6 18v4h12v-4A10 10 0 0 0 17 3z" fill={C.GOLD} /><rect x="12" y="27" width="10" height="4" rx="2" fill={C.NAVY} /></svg>)
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main style={{ background: C.NAVY, minHeight: '100vh', padding: '40px 16px 96px', fontFamily: SANS, color: C.TEXT, fontSize: 20, lineHeight: 1.65 }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <a href="/" style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.GOLD, textDecoration: 'none' }}>Балабони</a>
        {children}
        <p style={{ color: C.LIGHT, fontSize: 14, lineHeight: 1.7, marginTop: 40 }}>
          Правила звірені з чинним стандартом державної мови «Український правопис» (рішення Національної комісії зі стандартів державної мови № 47 від 01.03.2026, чинний з 28.03.2026).
          Офіційний текст — на <a href={SOURCE_URL} target="_blank" rel="noopener" style={{ color: C.GOLD }}>mova.gov.ua</a>. Матеріали стандарту — за ліцензією Creative Commons Attribution 4.0. Довідник має освітній характер; у спірних випадках першоджерелом є офіційний текст.
        </p>
      </div>
    </main>
  )
}

export type Crumb = { name: string; href: string }
export function Crumbs({ items }: { items: Crumb[] }) {
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: BASE + c.href })) }
  return (
    <>
      <nav aria-label="Хлібні крихти" style={{ margin: '18px 0 0', fontSize: 15, color: C.LIGHT }}>
        {items.map((c, i) => (
          <span key={c.href}>
            {i > 0 && <span aria-hidden="true"> › </span>}
            {i < items.length - 1 ? <a href={c.href} style={{ color: C.LIGHT }}>{c.name}</a> : <span aria-current="page" style={{ color: '#fff' }}>{c.name}</span>}
          </span>
        ))}
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  )
}

export function Tabs({ active, slug }: { active: 'uchnyam' | 'studentam'; slug?: string }) {
  const tab = (key: 'uchnyam' | 'studentam', label: string) => {
    const on = active === key
    const href = `/pravopys/${key}${slug ? '/' + slug : ''}`
    return (
      <a href={href} aria-current={on ? 'page' : undefined} style={{ padding: '10px 22px', borderRadius: 999, fontWeight: 700, fontSize: 17, textDecoration: 'none', background: on ? C.GOLD : 'transparent', color: on ? C.NAVY : '#f8fafc', border: `2px solid ${on ? C.GOLD : '#334155'}` }}>{label}</a>
    )
  }
  return <div style={{ display: 'flex', gap: 10, margin: '22px 0 18px', flexWrap: 'wrap' }}>{tab('uchnyam', 'Учням')}{tab('studentam', 'Студентам')}</div>
}

export function Card({ children, id }: { children: ReactNode; id?: string }) {
  return <section id={id} style={{ background: C.CARD, borderRadius: 22, padding: '28px 26px 30px', margin: '0 0 24px', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>{children}</section>
}

export function Label({ children }: { children: ReactNode }) {
  return <span style={{ display: 'inline-block', fontSize: 14, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.NAVY, background: C.GOLD, padding: '5px 12px', borderRadius: 8 }}>{children}</span>
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 5vw, 38px)', lineHeight: 1.2, color: C.NAVY, margin: '14px 0 10px' }}>{children}</h1>
}

export function Lead({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 20, color: C.TEXT, margin: '0 0 18px' }}>{children}</p>
}

export function RuleItem({ it, kind }: { it: Item; kind: 'yes' | 'no' | 'info' }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.BORDER}`, borderLeft: `6px solid ${kind === 'no' ? C.NAVY : C.GOLD}`, borderRadius: 14, padding: '14px 18px', margin: '10px 0' }}>
      {it.t && <span>{it.t}{it.ex ? ' — ' : ''}</span>}
      {it.ex && <b style={{ color: C.NAVY, fontSize: 21 }}>{it.ex}</b>}
    </div>
  )
}

export function OkNo({ ok, wrong }: { ok: string[]; wrong: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, margin: '16px 0' }}>
      {ok.length > 0 && <div style={{ background: C.GOLD_BG, borderRadius: 14, padding: '14px 18px', fontSize: 21, fontWeight: 700, color: C.NAVY, display: 'flex', gap: 12, alignItems: 'center' }}><IconYes />{ok.join(', ')}</div>}
      {wrong.length > 0 && <div style={{ background: C.BORDER, borderRadius: 14, padding: '14px 18px', fontSize: 21, fontWeight: 700, color: '#475569', display: 'flex', gap: 12, alignItems: 'center' }}><IconNo /><span style={{ textDecoration: 'line-through', textDecorationThickness: 2 }}>{wrong.join(', ')}</span></div>}
    </div>
  )
}

export function Related({ rule, audience }: { rule: Rule; audience: 'uchnyam' | 'studentam' }) {
  const list = rule.related.map((s) => RULES.find((r) => r.slug === s)).filter(Boolean) as Rule[]
  const other = audience === 'uchnyam' ? 'studentam' : 'uchnyam'
  return (
    <Card>
      <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '0 0 12px' }}>Схожі правила</h2>
      <ul style={{ margin: 0, paddingLeft: 22 }}>
        {list.map((r) => <li key={r.slug} style={{ margin: '6px 0' }}><a href={`/pravopys/${audience}/${r.slug}`} style={{ color: C.NAVY, fontWeight: 700 }}>{r.name}</a></li>)}
      </ul>
      <p style={{ margin: '16px 0 0' }}>
        <a href={`/pravopys/${other}/${rule.slug}`} style={{ color: C.NAVY, fontWeight: 700 }}>{audience === 'uchnyam' ? `${rule.name}: повне правило для студентів (${rule.para}) →` : `${rule.name}: просте пояснення для учнів →`}</a>
      </p>
    </Card>
  )
}

export function ReadCta() {
  return (
    <Card>
      <h2 style={{ fontFamily: SERIF, fontSize: 26, color: C.NAVY, margin: '0 0 8px' }}>Читайте українською правильно</h2>
      <p style={{ margin: '0 0 14px' }}>Найкраща вправа з правопису — читати добрі тексти. На Балабонах сотні оповідань і казок українською, які можна читати й слухати.</p>
      <a href="/stories" style={{ display: 'inline-block', background: C.GOLD, color: C.NAVY, fontWeight: 800, padding: '12px 22px', borderRadius: 999, textDecoration: 'none', fontSize: 18 }}>Читати оповідання →</a>
    </Card>
  )
}

export function FaqLd({ faq }: { faq: { q: string; a: string }[] }) {
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
}

export function RuleLinkCard({ r, audience }: { r: Rule; audience: 'uchnyam' | 'studentam' }) {
  return (
    <a href={`/pravopys/${audience}/${r.slug}`} style={{ display: 'block', background: '#fff', border: `1px solid ${C.BORDER}`, borderLeft: `6px solid ${C.GOLD}`, borderRadius: 14, padding: '14px 18px', textDecoration: 'none', color: C.TEXT }}>
      <b style={{ color: C.NAVY, fontSize: 21 }}>{r.name}</b>
      <span style={{ display: 'block', fontSize: 16, color: C.MUTED }}>{audience === 'studentam' ? `${r.section} · ${r.para}` : `${r.grades.map((g) => g + ' клас').join(', ')}`}</span>
    </a>
  )
}
