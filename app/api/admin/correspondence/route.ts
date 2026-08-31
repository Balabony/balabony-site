import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

/**
 * Реєстр листування з авторами.
 *
 * Наскрізна нумерація (2026/0001) присвоюється тригером у базі —
 * спільна для вхідних і вихідних. Строк відповіді для вихідних
 * рахується автоматично за типом звернення:
 *   edits_objection   — 14 днів (п. 3.1-2)
 *   archive_objection — 30 днів (п. 2.4-1)
 *
 * GET   — список із фільтрами
 * POST  — завести лист вручну (вхідний або вихідний)
 * PATCH — позначити, що на звернення відповіли
 *
 * author_emails лишається технічним журналом відправки і сюди не пише:
 * вихідні листи потрапляють у реєстр окремим записом.
 */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

const KINDS = [
  'edits_objection',
  'archive_objection',
  'withdrawal',
  'contract',
  'general',
] as const
type Kind = (typeof KINDS)[number]

export type CorrRow = {
  id: string
  number: string
  direction: 'in' | 'out'
  kind: Kind
  subject: string | null
  body: string | null
  author_id: string
  author_email: string | null
  author_name: string | null
  pen_name: string | null
  content_title: string | null
  happened_at: string
  due_at: string | null
  answered_at: string | null
  answered_number: string | null
  source: string
  note: string | null
  days_left: number | null
}

const LIST_SQL = `
  select c.id::text                as id,
         c.number                  as number,
         c.direction               as direction,
         c.kind                    as kind,
         c.subject                 as subject,
         c.body                    as body,
         c.author_id::text         as author_id,
         c.author_email            as author_email,
         p.display_name            as author_name,
         p.pen_name                as pen_name,
         t.title                   as content_title,
         c.happened_at             as happened_at,
         c.due_at                  as due_at,
         c.answered_at             as answered_at,
         a.number                  as answered_number,
         c.source                  as source,
         c.note                    as note,
         case
           when c.due_at is null or c.answered_at is not null then null
           else floor(extract(epoch from (c.due_at - now())) / 86400)::int
         end                       as days_left
    from correspondence c
    left join author_profiles p on p.user_id = c.author_id
    left join content t         on t.id = c.content_id
    left join correspondence a  on a.id = c.answered_by
   order by c.happened_at desc, c.number desc
   limit 500
`

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  try {
    const r = await dbQuery(LIST_SQL, [])
    const rows = (r.rows ?? []) as CorrRow[]

    const open = rows.filter((x) => x.answered_at === null && x.direction === 'in').length
    const overdue = rows.filter(
      (x) => x.answered_at === null && x.days_left !== null && x.days_left < 0,
    ).length

    const a = await dbQuery(
      `select user_id::text as id, display_name as name, email
         from author_profiles
        where display_name is not null
        order by display_name`,
      [],
    )
    const authors = (a.rows ?? []) as { id: string; name: string; email: string | null }[]

    return NextResponse.json({ ok: true, rows, open, overdue, authors })
  } catch {
    return NextResponse.json({ ok: false, error: 'Помилка бази' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  let body: {
    direction?: string
    author_id?: string
    kind?: string
    subject?: string
    body?: string
    content_id?: string
    happened_at?: string
    note?: string
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false, error: 'Не читається запит' }, { status: 400 })
  }

  const direction = body.direction === 'in' ? 'in' : body.direction === 'out' ? 'out' : null
  if (!direction) {
    return NextResponse.json({ ok: false, error: 'Не вказано напрям' }, { status: 400 })
  }

  const authorId = (body.author_id ?? '').trim()
  if (!authorId) {
    return NextResponse.json({ ok: false, error: 'Не вказано автора' }, { status: 400 })
  }

  const kind = (KINDS as readonly string[]).includes(body.kind ?? '')
    ? (body.kind as Kind)
    : 'general'

  const subject = (body.subject ?? '').trim() || null
  const text = (body.body ?? '').trim() || null
  const contentId = (body.content_id ?? '').trim() || null
  const note = (body.note ?? '').trim() || null
  const happenedAt = (body.happened_at ?? '').trim() || null

  try {
    const p = await dbQuery(
      `select email from author_profiles where user_id = $1 limit 1`,
      [authorId],
    )
    if (p.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Автора не знайдено' }, { status: 404 })
    }
    const email = (p.rows[0] as { email: string | null }).email

    const ins = await dbQuery(
      `insert into correspondence
         (direction, author_id, author_email, kind, subject, body, content_id, happened_at, source, note)
       values ($1, $2, $3, $4, $5, $6, $7, coalesce($8::timestamptz, now()), 'manual', $9)
       returning id::text as id, number, due_at`,
      [direction, authorId, email, kind, subject, text, contentId, happenedAt, note],
    )

    const row = ins.rows[0] as { id: string; number: string; due_at: string | null }
    return NextResponse.json({ ok: true, ...row })
  } catch {
    return NextResponse.json({ ok: false, error: 'Не вдалося записати' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  let body: { id?: string; answered_by?: string; undo?: boolean }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false, error: 'Не читається запит' }, { status: 400 })
  }

  const id = (body.id ?? '').trim()
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Не вказано звернення' }, { status: 400 })
  }

  const answeredBy = (body.answered_by ?? '').trim() || null

  try {
    if (body.undo === true) {
      await dbQuery(
        `update correspondence set answered_at = null, answered_by = null where id = $1`,
        [id],
      )
      return NextResponse.json({ ok: true, answered_at: null })
    }

    const r = await dbQuery(
      `update correspondence
          set answered_at = now(),
              answered_by = coalesce($2::uuid, answered_by)
        where id = $1
      returning answered_at`,
      [id, answeredBy],
    )
    if (r.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Звернення не знайдено' }, { status: 404 })
    }
    const row = r.rows[0] as { answered_at: string }
    return NextResponse.json({ ok: true, answered_at: row.answered_at })
  } catch {
    return NextResponse.json({ ok: false, error: 'Не вдалося оновити' }, { status: 500 })
  }
}
