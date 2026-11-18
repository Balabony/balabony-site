import { redirect, notFound } from 'next/navigation'
import { dbQuery } from '@/lib/db'
import { getEditor } from '@/lib/editor-auth'
import { ensureContentReviewTable } from '@/lib/content-review'
import DecisionForm from './DecisionForm'

/**
 * Твір, затриманий до перевірки, у кабінеті редактора (18.11.2026, редактор вирішує сам).
 * ІМЕНІ, ПОШТИ Й ТЕЛЕФОНУ АВТОРА ТУТ НЕМАЄ — вони не входять у запит.
 */

export const dynamic = 'force-dynamic'

const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"
const NAVY = '#0a1628'
const CARD = '#0f1f38'
const GOLD_L = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const LINE = 'rgba(255,255,255,.10)'

export default async function EditorContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const editor = await getEditor()
  if (!editor) redirect('/editor/login')
  if (!/^[0-9a-f-]{32,40}$/i.test(id)) notFound()

  await ensureContentReviewTable()
  const r = await dbQuery(
    `select c.title, c.genre, c.text, c.status::text as status, rv.decision,
            array_length(regexp_split_to_array(trim(coalesce(c.text,'')), '\\s+'), 1) as words,
            m.reasons
       from content_reviews rv
       join content c on c.id = rv.content_id
  left join content_moderation m on m.content_id = c.id
      where rv.content_id = $1 and rv.editor_id = $2
      limit 1`,
    [id, editor.id],
  )
  if (!r.rowCount) notFound()
  const w = r.rows[0] as { title: string; genre: string | null; text: string | null; status: string; decision: string | null; words: number | null; reasons: string[] | null }
  const closed = w.decision !== null || w.status !== 'review'
  const reasons = Array.isArray(w.reasons) ? w.reasons : []

  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '28px 18px 80px', fontFamily: FONT, color: CREAM }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <a href="/editor" style={{ fontSize: 13.5, color: MUTED, textDecoration: 'none' }}>← Мої роботи</a>

        <h1 style={{ fontSize: 21, color: GOLD_L, fontWeight: 600, margin: '1rem 0 .3rem' }}>«{w.title}»</h1>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: '1rem' }}>
          Твір затримано до перевірки{w.genre ? ` · ${w.genre}` : ''} · слів: {(w.words ?? 0).toLocaleString('uk-UA')}
          {closed ? ' · рішення вже ухвалено' : ''}
        </div>

        {reasons.length > 0 && (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '.8rem 1rem', marginBottom: '1rem', fontSize: 13.5, lineHeight: 1.6, color: MUTED }}>
            <div style={{ color: GOLD_L, marginBottom: 4 }}>Зауваження автоматичної перевірки</div>
            {reasons.map((x, i) => <div key={i}>{x}</div>)}
          </div>
        )}

        <div style={{
          whiteSpace: 'pre-wrap', fontFamily: SERIF, fontSize: 16.5, lineHeight: 1.8, color: CREAM,
          background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '1.1rem 1.2rem',
        }}>
          {w.text ?? ''}
        </div>

        <div style={{ marginTop: '1.6rem' }}>
          <DecisionForm contentId={id} closed={closed} />
        </div>
      </div>
    </main>
  )
}
