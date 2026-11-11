// 11.11.2026: звіти ШІ про грамотність творів у графіку публікацій (джерело 'content').
// Перевірка йде щогодини (cron grammar-auto), найближчі до виходу — першими.
import { dbQuery } from '@/lib/db'
import { ensureGrammarTable } from '@/lib/grammar-auto'
import GrammarReport from '@/app/editor/GrammarReport'
import type { GrammarResult } from '@/lib/grammar-check'

export const metadata = { title: 'Грамотність творів — адмінка', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#ef9f27', MUTED = '#b9c6db', LINE = 'rgba(143,163,196,0.22)'

type Row = { id: string; title: string; author_name: string | null; status: string; publish_at: string | null; slug: string | null; result: GrammarResult | null }

export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams
  await ensureGrammarTable()
  const r = await dbQuery(
    `select c.id::text, c.title, c.author_name, c.status::text as status, c.publish_at, c.slug, g.result
       from content c
       left join grammar_checks g on g.source = 'content' and g.source_id = c.id::text
      where c.status::text in ('scheduled', 'approved', 'review')
        and coalesce(c.text, '') <> ''
        and not exists (select 1 from contest_episodes ep where ep.content_id = c.id)
      order by c.publish_at asc nulls last`,
  )
  const all = r.rows as Row[]
  const done = all.filter((x) => x.result)
  const weak = done.filter((x) => x.result?.level === 'слабка')
  const mid = done.filter((x) => x.result?.level === 'середня')
  const shown = f === 'weak' ? weak : f === 'mid' ? mid : f === 'todo' ? all.filter((x) => !x.result) : all
  const date = (d: string | null) => (d ? new Date(d).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Kyiv' }) : 'без дати')
  const chip = (key: string | undefined, label: string, n: number) => (
    <a href={key ? `?f=${key}` : '?'} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${f === key ? GOLD : LINE}`, color: f === key ? GOLD : '#e8eef7', textDecoration: 'none', fontSize: 14 }}>{label}: {n}</a>
  )
  return (
    <main style={{ fontFamily: FONT, color: '#e8eef7', maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <h1 style={{ fontSize: 26, margin: '0 0 .4rem' }}>Грамотність творів у графіку</h1>
      <p style={{ color: MUTED, margin: '0 0 1rem', lineHeight: 1.6 }}>
        ШІ перевіряє твори щогодини, найближчі до публікації — першими. Текст не змінюється: це підказка для редактора.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 1.2rem' }}>
        {chip(undefined, 'Усі', all.length)}
        {chip('todo', 'Ще в черзі', all.length - done.length)}
        {chip('weak', 'Слабка грамотність', weak.length)}
        {chip('mid', 'Середня', mid.length)}
      </div>
      {shown.map((x) => (
        <section key={x.id} style={{ borderTop: `1px solid ${LINE}`, padding: '1rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', margin: '0 0 .5rem' }}>
            <strong style={{ fontSize: 16 }}>{x.title}</strong>
            <span style={{ color: MUTED, fontSize: 14 }}>{x.author_name ?? '—'} · вихід {date(x.publish_at)}</span>
          </div>
          {x.result ? <GrammarReport g={x.result} open={false} /> : <div style={{ color: MUTED, fontSize: 13 }}>У черзі на перевірку.</div>}
        </section>
      ))}
    </main>
  )
}
