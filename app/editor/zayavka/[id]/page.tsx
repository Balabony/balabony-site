import { redirect, notFound } from 'next/navigation'
import { dbQuery } from '@/lib/db'
import { getEditor } from '@/lib/editor-auth'
import { AUTHOR_QUESTIONS } from '@/lib/author-questions'
import { ensureReviewTable, type Verdict } from '@/lib/application-review'
import VerdictForm from './VerdictForm'

/**
 * Заявка нового автора в кабінеті редактора (30.10.2026, «як у конкурсах»).
 *
 * ІМЕНІ, ПОШТИ Й ТЕЛЕФОНУ АВТОРА ТУТ НЕМАЄ — вони не входять у запит.
 * Редактор бачить назву, жанр, текст і відповіді на запитання.
 * Чужих відгуків теж немає: кожен редактор радить незалежно.
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

export default async function EditorApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const editor = await getEditor()
  if (!editor) redirect('/editor/login')
  if (!/^\d+$/.test(id)) notFound()

  await ensureReviewTable()
  const r = await dbQuery(
    `select a.title, a.genre, a.words, a.body, a.answers, a.status, rv.verdict, rv.comment
       from application_reviews rv
       join author_applications a on a.id = rv.application_id
      where rv.application_id = $1 and rv.editor_id = $2
      limit 1`,
    [id, editor.id],
  )
  if (!r.rowCount) notFound()
  const a = r.rows[0] as {
    title: string; genre: string | null; words: number; body: string
    answers: Record<string, string> | null; status: string
    verdict: Verdict | null; comment: string | null
  }

  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '28px 18px 80px', fontFamily: FONT, color: CREAM }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <a href="/editor" style={{ fontSize: 13.5, color: MUTED, textDecoration: 'none' }}>← Мої роботи</a>

        <h1 style={{ fontSize: 21, color: GOLD_L, fontWeight: 600, margin: '1rem 0 .3rem' }}>«{a.title}»</h1>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: '1rem' }}>
          Заявка нового автора{a.genre ? ` · ${a.genre}` : ''} · слів: {a.words.toLocaleString('uk-UA')}
          {a.status !== 'new' ? ' · рішення вже ухвалено' : ''}
        </div>

        <div style={{
          whiteSpace: 'pre-wrap', fontFamily: SERIF, fontSize: 16.5, lineHeight: 1.8, color: CREAM,
          background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '1.1rem 1.2rem',
        }}>
          {a.body}
        </div>

        {a.answers && AUTHOR_QUESTIONS.some(q => a.answers?.[q.id]) && (
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: 14.5, color: GOLD_L, padding: '.4rem 0' }}>
              Відповіді автора на запитання
            </summary>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '1rem', fontSize: 14, lineHeight: 1.6 }}>
              {AUTHOR_QUESTIONS.filter(q => a.answers?.[q.id] && q.id !== 'cover').map(q => (
                <div key={q.id} style={{ marginBottom: 12 }}>
                  <div style={{ color: MUTED, fontSize: 13 }}>{q.label}</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{a.answers?.[q.id]}</div>
                </div>
              ))}
            </div>
          </details>
        )}

        <div style={{ marginTop: '1.6rem' }}>
          <VerdictForm appId={id} verdict={a.verdict} comment={a.comment ?? ''} closed={a.status !== 'new'} />
        </div>
      </div>
    </main>
  )
}
