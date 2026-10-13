import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { routeEntry } from '@/lib/contest-routing'

/**
 * Зведена таблиця оцінок конкурсу: /api/admin/contest-ranking
 *
 * GET ?contest=<id> — усі заявки конкурсу з трьома незалежними оцінками:
 *   ШІ (0–100, остання з contest_ai_reviews), редактор (0–50 з contest_scores,
 *   лише подана; плюс «друга думка», якщо є), засновник (0–100).
 * POST { entryId, score, comment } — зберегти / змінити оцінку засновника.
 *
 * Лише для адміна. Редактори цієї сторінки не бачать.
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const contest = req.nextUrl.searchParams.get('contest') ?? ''
  if (!contest) return NextResponse.json({ ok: false, error: 'Не вказано конкурс' }, { status: 400 })
  try {
    const r = await dbQuery(
      `select e.id::text as id, e.entry_number, e.title,
              coalesce(nullif(e.author_name, ''), (select coalesce(nullif(p.full_name, ''), p.pen_name) from author_profiles p where p.user_id::text = e.author_id::text limit 1)) as author_name,
              e.email, e.status, e.created_at,
              (select p.phone from author_profiles p where p.user_id::text = e.author_id::text limit 1) as phone,
              (select count(*)::int from contest_episodes ep where ep.entry_id = e.id) as episodes,
              (select total from contest_ai_reviews a where a.entry_id = e.id::text order by a.created_at desc limit 1) as ai_total,
              (select (result->>'index')::int from ai_style_checks s where s.source = 'contest' and s.source_id = e.id::text order by s.created_at desc limit 1) as style_index,
              (select s.total from contest_assignments a join contest_scores s on s.entry_id = a.entry_id and s.editor_id = a.editor_id
                 where a.entry_id = e.id and a.role = 'primary' and s.status = 'submitted' limit 1) as editor_total,
              (select ed.name from contest_assignments a join editors ed on ed.id = a.editor_id
                 where a.entry_id = e.id and a.role = 'primary' limit 1) as editor_name,
              (select ed.email from contest_assignments a join editors ed on ed.id = a.editor_id
                 where a.entry_id = e.id and a.role = 'primary' limit 1) as editor_email,
              (select ed.name from contest_assignments a join editors ed on ed.id = a.editor_id
                 where a.entry_id = e.id and a.role = 'recheck' limit 1) as recheck_name,
              (select ed.email from contest_assignments a join editors ed on ed.id = a.editor_id
                 where a.entry_id = e.id and a.role = 'recheck' limit 1) as recheck_email,
              (select s.total from contest_assignments a join contest_scores s on s.entry_id = a.entry_id and s.editor_id = a.editor_id
                 where a.entry_id = e.id and a.role = 'recheck' and s.status = 'submitted' limit 1) as recheck_total,
              f.score as founder_score, f.comment as founder_comment
         from contest_entries e
         left join contest_founder_scores f on f.entry_id = e.id::text
        where e.contest = $1
        order by e.created_at`,
      [contest],
    )
    return NextResponse.json({ ok: true, entries: r.rows })
  } catch (err) {
    console.error('[contest-ranking GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Помилка бази. Чи створено таблицю contest_founder_scores?' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let b: { entryId?: string; score?: unknown; comment?: string; action?: string }
  try { b = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 }) }

  // Скерувати всі нерозподілені: номер + редактор + лист редактору.
  if (b.action === 'route-all') {
    try {
      const r = await dbQuery(
        `select e.id::text as id from contest_entries e
          where e.status <> 'rejected'
            and (e.entry_number is null
                 or not exists (select 1 from contest_assignments a where a.entry_id = e.id and a.role = 'primary'))
          order by e.created_at`,
      )
      let routed = 0
      for (const row of r.rows as { id: string }[]) {
        const res = await routeEntry(row.id)
        if (res.editor || res.number) routed++
      }
      return NextResponse.json({ ok: true, routed })
    } catch (err) {
      console.error('[contest-ranking route-all]', (err as Error)?.message)
      return NextResponse.json({ ok: false, error: 'Не вдалося скерувати' }, { status: 500 })
    }
  }
  const entryId = String(b.entryId ?? '').trim()
  const score = Number(b.score)
  const comment = String(b.comment ?? '').trim().slice(0, 4000)
  if (!entryId) return NextResponse.json({ ok: false, error: 'Не вказано заявку' }, { status: 400 })
  if (!Number.isInteger(score) || score < 0 || score > 100) return NextResponse.json({ ok: false, error: 'Оцінка — ціле число від 0 до 100' }, { status: 400 })
  try {
    await dbQuery(
      `insert into contest_founder_scores (entry_id, score, comment, updated_at)
       values ($1, $2, $3, now())
       on conflict (entry_id) do update set score = excluded.score, comment = excluded.comment, updated_at = now()`,
      [entryId, score, comment],
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contest-ranking POST]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти' }, { status: 500 })
  }
}
