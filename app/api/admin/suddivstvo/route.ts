import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { sendEditorAssignedEmail, sendEditorDigestEmail } from '@/lib/contest-routing'

/**
 * Суддівство конкурсів — адмінська частина.
 *
 * Окремий роут, а не додаток до /api/admin/konkursy: той відповідає за
 * приймання заявок і створення чернеток, і його вже важко читати. Змішувати
 * з ним призначення редакторів означало б, що будь-яка правка суддівства
 * ризикує зачепити приймання.
 *
 * ЩО РОБИТЬ
 *   GET            — редактори, номери робіт, призначення, стан оцінок.
 *   POST number    — присвоює номери роботам конкурсу.
 *   POST assign    — призначає основного редактора роботі.
 *   POST unassign  — знімає призначення.
 *   POST recheck   — призначає другого редактора («друга думка»).
 *
 * ЧОГО СВІДОМО НЕ РОБИТЬ
 *   Не рахує автоматично, кому потрібна «друга думка». Правило з умов
 *   порівнює редакційний бал із балом за дочитування, але як кількість
 *   дочитувань перетворюється на 50 балів — ніде не визначено. Поки
 *   формули немає, рішення ухвалює людина, а сторінка лише показує
 *   обидва числа поруч.
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const editors = await dbQuery(
      `select id, name, email from editors order by name asc`,
    )

    // Номери робіт і призначення однією вибіркою: сторінці потрібні разом.
    const rows = await dbQuery(
      `select e.id::text                         as entry_id,
              e.entry_number,
              a.editor_id                        as primary_editor,
              r.editor_id                        as recheck_editor,
              s.status                           as score_status,
              s.total                            as score_total,
              rs.total                           as recheck_total
         from contest_entries e
         left join contest_assignments a
                on a.entry_id = e.id and a.role = 'primary'
         left join contest_assignments r
                on r.entry_id = e.id and r.role = 'recheck'
         left join contest_scores s
                on s.entry_id = e.id and s.editor_id = a.editor_id
         left join contest_scores rs
                on rs.entry_id = e.id and rs.editor_id = r.editor_id`,
    )

    return NextResponse.json({
      ok: true,
      editors: editors.rows,
      judging: rows.rows,
    })
  } catch (err) {
    console.error('[admin/suddivstvo GET]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'db error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({})) as {
      action?: string
      contest?: string
      entryId?: string
      editorId?: number
    }
    const action = String(body.action ?? '')

    // ── Нумерація ────────────────────────────────────────────────────────
    // Номери наскрізні в межах конкурсу і НЕ переприсвоюються: раз
    // присвоєний номер лишається за роботою назавжди, інакше посилання на
    // «роботу № 7» у протоколі втратить сенс. Тому нумеруються лише ті,
    // у кого номера ще немає, а нові починаються від найбільшого наявного.
    if (action === 'number') {
      const contest = String(body.contest ?? '')
      if (!contest) {
        return NextResponse.json({ ok: false, error: 'Не вказано конкурс' }, { status: 400 })
      }

      const res = await dbQuery(
        `with start as (
           select coalesce(max(entry_number), 0) as n
             from contest_entries where contest = $1
         ),
         queue as (
           select id,
                  row_number() over (order by created_at, id) as k
             from contest_entries
            where contest = $1
              and entry_number is null
              and status = 'accepted'
         )
         update contest_entries e
            set entry_number = start.n + queue.k
           from queue, start
          where e.id = queue.id
        returning e.id`,
        [contest],
      )

      return NextResponse.json({ ok: true, numbered: res.rowCount ?? 0 })
    }

    // ── 18.10.2026: «Нагадати редакторам» — одним натисканням. Кожен редактор
    // отримує ОДИН лист зі списком своїх робіт, які він ще не оцінив.
    if (action === 'notify-all') {
      const r = await dbQuery(
        `select ed.id, ed.name, ed.email, e.entry_number, e.title, e.contest
           from contest_assignments a
           join editors ed on ed.id = a.editor_id
           join contest_entries e on e.id = a.entry_id
           left join contest_scores s on s.entry_id = a.entry_id and s.editor_id = a.editor_id
          where e.status <> 'rejected'
            and coalesce(s.status, '') <> 'submitted'
          order by ed.name, e.contest, e.entry_number`,
      )
      const by = new Map<number, { name: string; email: string; items: { n: number | null; t: string; c: string }[] }>()
      for (const x of r.rows as { id: number; name: string; email: string; entry_number: number | null; title: string; contest: string }[]) {
        if (!x.email) continue
        if (!by.has(x.id)) by.set(x.id, { name: x.name, email: x.email, items: [] })
        by.get(x.id)!.items.push({ n: x.entry_number, t: x.title, c: x.contest })
      }
      const sent: string[] = []
      for (const ed of by.values()) {
        await sendEditorDigestEmail({ to: ed.email, editorName: ed.name, items: ed.items })
        sent.push(`${ed.name} — ${ed.items.length}`)
      }
      return NextResponse.json({ ok: true, sent })
    }

    // ── Призначення ──────────────────────────────────────────────────────
    const entryId = String(body.entryId ?? '')
    if (!entryId) {
      return NextResponse.json({ ok: false, error: 'Не вказано роботу' }, { status: 400 })
    }

    if (action === 'unassign') {
      // Знімаємо тільки призначення. Оцінку, якщо вона вже є, лишаємо:
      // мовчки стерти чужу роботу — гірше, ніж лишити слід у базі.
      await dbQuery(
        `delete from contest_assignments where entry_id = $1 and role = 'primary'`,
        [entryId],
      )
      return NextResponse.json({ ok: true })
    }

    const editorId = Number(body.editorId ?? 0)
    if (!editorId) {
      return NextResponse.json({ ok: false, error: 'Не вказано редактора' }, { status: 400 })
    }

    // Робота має бути пронумерована: без номера редактор побачить у
    // кабінеті порожнє місце замість позначки роботи.
    const numbered = await dbQuery(
      `select entry_number from contest_entries where id = $1`,
      [entryId],
    )
    if (!numbered.rowCount) {
      return NextResponse.json({ ok: false, error: 'Роботу не знайдено' }, { status: 404 })
    }
    if ((numbered.rows[0] as { entry_number: number | null }).entry_number === null) {
      return NextResponse.json(
        { ok: false, error: 'Спершу пронумеруйте роботи цього конкурсу' },
        { status: 400 },
      )
    }

    if (action === 'assign') {
      // Якщо цей редактор уже стоїть на роботі як «друга думка», прибираємо
      // той рядок: інакше спрацює унікальність по парі «робота + редактор».
      await dbQuery(
        `delete from contest_assignments
          where entry_id = $1 and editor_id = $2 and role = 'recheck'`,
        [entryId, editorId],
      )

      // Один основний редактор на роботу — зміна замінює попереднього.
      const before = await dbQuery(
        `select editor_id from contest_assignments where entry_id = $1 and role = 'primary'`,
        [entryId],
      )
      const prevId = before.rowCount ? (before.rows[0] as { editor_id: number }).editor_id : null
      await dbQuery(
        `insert into contest_assignments (entry_id, editor_id, role)
         values ($1, $2, 'primary')
         on conflict (entry_id) where role = 'primary'
         do update set editor_id = excluded.editor_id, assigned_at = now()`,
        [entryId, editorId],
      )
      // 18.10.2026: ручне призначення раніше не надсилало листа — редакторка,
      // якій роботу передали в адмінці, про неї не дізнавалася. Лист — лише коли
      // редактор справді змінився, щоб повторне збереження не спамило.
      const mailed = prevId !== editorId ? await notifyEditor(entryId, editorId) : false
      return NextResponse.json({ ok: true, mailed })
    }

    if (action === 'recheck') {
      const primary = await dbQuery(
        `select editor_id from contest_assignments
          where entry_id = $1 and role = 'primary'`,
        [entryId],
      )
      const primaryId = primary.rowCount
        ? (primary.rows[0] as { editor_id: number }).editor_id
        : null

      // Друга думка від того самого редактора — не думка.
      if (primaryId === editorId) {
        return NextResponse.json(
          { ok: false, error: 'Другу думку має дати інший редактор' },
          { status: 400 },
        )
      }

      await dbQuery(
        `delete from contest_assignments where entry_id = $1 and role = 'recheck'`,
        [entryId],
      )
      await dbQuery(
        `insert into contest_assignments (entry_id, editor_id, role)
         values ($1, $2, 'recheck')`,
        [entryId, editorId],
      )
      const mailed = await notifyEditor(entryId, editorId)
      return NextResponse.json({ ok: true, mailed })
    }

    // 18.10.2026: повторно надіслати лист редакторові про вже призначену роботу.
    if (action === 'notify') {
      const mailed = await notifyEditor(entryId, editorId)
      return NextResponse.json({ ok: true, mailed })
    }

    return NextResponse.json({ ok: false, error: 'Невідома дія' }, { status: 400 })
  } catch (err) {
    console.error('[admin/suddivstvo POST]', (err as Error)?.message)
    return NextResponse.json({ ok: false, error: 'Не вдалося виконати дію' }, { status: 500 })
  }
}

/** Лист редакторові «Вам скеровано роботу № …». Повертає true, якщо лист пішов у відправку. */
async function notifyEditor(entryId: string, editorId: number): Promise<boolean> {
  const r = await dbQuery(
    `select ed.name, ed.email, e.entry_number, e.title, e.contest
       from editors ed, contest_entries e
      where ed.id = $1 and e.id::text = $2`,
    [editorId, entryId],
  )
  const row = r.rows[0] as { name: string; email: string; entry_number: number | null; title: string; contest: string } | undefined
  if (!row?.email) return false
  await sendEditorAssignedEmail({ to: row.email, editorName: row.name, number: row.entry_number, title: row.title, contest: row.contest })
  return true
}
