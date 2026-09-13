import { redirect, notFound } from 'next/navigation'
import { dbQuery } from '@/lib/db'
import { getEditor } from '@/lib/editor-auth'
import { findContest } from '@/lib/contests'
import ScoreForm, { type ExistingScore } from '../ScoreForm'

/**
 * Сторінка оцінювання однієї конкурсної роботи.
 *
 * ПРІЗВИЩА АВТОРА ТУТ НЕМАЄ — як і в переліку, воно не входить у запит.
 * Редактор бачить номер, назву і тексти серій.
 *
 * ЧУЖИХ ОЦІНОК ТЕЖ НЕМАЄ. contest_scores читається виключно по своєму
 * editor_id: в умовах обіцяно, що редактор не бачить ні оцінок інших, ні
 * проміжних підсумків. Через це ж тут не показуються дочитування.
 */

export const dynamic = 'force-dynamic'

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628'
const CARD = '#0f1f38'
const GOLD_L = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const LINE = 'rgba(255,255,255,.10)'

type Entry = {
  entry_number: number | null
  title: string
  annotation: string | null
  genre: string | null
  contest: string
  role: string
}

type Episode = { ord: number; words: number; body: string }

export default async function EditorScorePage(
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params
  const editor = await getEditor()
  if (!editor) redirect('/editor/login')

  const e = await dbQuery(
    `select en.entry_number, en.title, en.annotation, en.genre, en.contest, a.role
       from contest_assignments a
       join contest_entries en on en.id = a.entry_id
      where a.entry_id = $1 and a.editor_id = $2
      limit 1`,
    [entryId, editor.id],
  )
  if (!e.rowCount) notFound()
  const entry = e.rows[0] as Entry

  const eps = await dbQuery(
    `select ord, words, body from contest_episodes where entry_id = $1 order by ord`,
    [entryId],
  )
  const episodes = eps.rows as Episode[]

  const sc = await dbQuery(
    `select plot, language, characters, structure, ending, hook,
            comment, status, total
       from contest_scores where entry_id = $1 and editor_id = $2 limit 1`,
    [entryId, editor.id],
  )
  const existing = (sc.rowCount ? sc.rows[0] : null) as ExistingScore | null

  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '28px 18px 80px', fontFamily: FONT, color: CREAM }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        <a href="/editor" style={{ fontSize: 13.5, color: MUTED, textDecoration: 'none' }}>
          ← Мої роботи
        </a>

        <h1 style={{ fontSize: 21, color: GOLD_L, fontWeight: 600, margin: '1rem 0 .3rem' }}>
          {entry.entry_number ? `№ ${entry.entry_number} · ` : ''}{entry.title}
        </h1>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: '.8rem' }}>
          {findContest(entry.contest)?.name ?? entry.contest}
          {' · '}серій: {episodes.length}
          {entry.genre ? ` · ${entry.genre}` : ''}
          {entry.role === 'recheck' ? ' · друга думка' : ''}
        </div>

        {entry.annotation && (
          <p style={{ fontSize: 14, color: '#B8C6D8', lineHeight: 1.7, margin: '0 0 1.4rem' }}>
            {entry.annotation}
          </p>
        )}

        {episodes.map(ep => (
          <details key={ep.ord} style={{ marginBottom: '.6rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: 14.5, color: CREAM, padding: '.4rem 0' }}>
              Серія {ep.ord} · {ep.words} слів
            </summary>
            <pre style={{
              whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif',
              fontSize: 15.5, lineHeight: 1.8, color: '#E6EDF7',
              background: CARD, border: `1px solid ${LINE}`,
              borderRadius: 10, padding: '1rem 1.1rem', margin: '.4rem 0 0',
            }}>{ep.body}</pre>
          </details>
        ))}

        <div style={{ marginTop: '1.6rem' }}>
          <ScoreForm entryId={entryId} existing={existing} />
        </div>
      </div>
    </main>
  )
}
