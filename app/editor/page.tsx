import { redirect } from 'next/navigation'
import { dbQuery } from '@/lib/db'
import { getEditor } from '@/lib/editor-auth'
import { findContest } from '@/lib/contests'

/**
 * Кабінет редактора конкурсів — перелік призначених робіт.
 *
 * ПРІЗВИЩ АВТОРІВ ТУТ НЕМАЄ. В умовах конкурсів обіцяно, що редактор
 * бачить номер і назву роботи. Тому автор не просто не показується —
 * його поля не входять у запит узагалі: сторінку колись перепишуть,
 * а забути про обіцянку в тій правці не можна.
 *
 * Редактор бачить ТІЛЬКИ свої призначення, не весь перелік конкурсу,
 * і не бачить чужих оцінок та проміжних підсумків.
 */

export const dynamic = 'force-dynamic'

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628'
const CARD = '#0f1f38'
const GOLD = '#ef9f27'
const GOLD_L = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const LINE = 'rgba(255,255,255,.10)'

type Row = {
  entry_id: string
  entry_number: number | null
  title: string
  contest: string
  role: string
  episodes: number
  words: number
  score_status: string | null
}

const STATE: Record<string, { label: string; color: string }> = {
  submitted: { label: 'оцінку подано', color: '#22c55e' },
  draft:     { label: 'чернетка оцінки', color: '#eab308' },
}

export default async function EditorHomePage() {
  const editor = await getEditor()
  if (!editor) redirect('/editor/login')

  const res = await dbQuery(
    `select e.id::text                      as entry_id,
            e.entry_number, e.title, e.contest,
            a.role,
            count(ep.id)::int               as episodes,
            coalesce(sum(ep.words), 0)::int as words,
            s.status                        as score_status
       from contest_assignments a
       join contest_entries e   on e.id = a.entry_id
  left join contest_episodes ep on ep.entry_id = e.id
  left join contest_scores s    on s.entry_id = e.id and s.editor_id = a.editor_id
      where a.editor_id = $1
      group by e.id, e.entry_number, e.title, e.contest, a.role, s.status, a.assigned_at
      order by a.assigned_at`,
    [editor.id],
  )
  const works = res.rows as Row[]

  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '28px 18px 80px', fontFamily: FONT, color: CREAM }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.8rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: GOLD }}>Balabony</div>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: 'uppercase' }}>
            Кабінет редактора
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: MUTED }}>{editor.name}</span>
        </div>

        <h1 style={{ fontSize: 21, color: GOLD_L, fontWeight: 600, margin: '1.4rem 0 .3rem' }}>
          Ваші роботи
        </h1>
        <p style={{ color: MUTED, fontSize: 13.5, margin: '0 0 1.4rem', lineHeight: 1.6 }}>
          Тут лише те, що призначено вам. Роботи позначені номерами — імена
          авторів не показуються нікому з редакторів.
        </p>

        {works.length === 0 && (
          <p style={{ color: MUTED }}>
            Робіт поки не призначено. Коли вони з’являться, ви побачите їх тут.
          </p>
        )}

        {works.map(w => {
          const st = w.score_status ? STATE[w.score_status] : null
          return (
            <a
              key={w.entry_id}
              href={`/editor/${w.entry_id}`}
              style={{
                display: 'block', textDecoration: 'none', color: CREAM,
                background: CARD, border: `1px solid ${LINE}`, borderRadius: 12,
                padding: '.9rem 1rem', marginBottom: '.7rem',
              }}
            >
              <div style={{ display: 'flex', gap: '.7rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15.5, fontWeight: 600, color: GOLD_L }}>
                  {w.entry_number ? `№ ${w.entry_number} · ` : ''}{w.title}
                </span>
                {w.role === 'recheck' && (
                  <span style={{ fontSize: 12, color: '#eab308' }}>друга думка</span>
                )}
                <span style={{ fontSize: 12.5, color: st?.color ?? MUTED, marginLeft: 'auto' }}>
                  {st?.label ?? 'оцінки немає'}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>
                {findContest(w.contest)?.name ?? w.contest}
                {' · '}серій: {w.episodes}
                {' · '}слів: {w.words.toLocaleString('uk-UA')}
              </div>
            </a>
          )
        })}
      </div>
    </main>
  )
}
