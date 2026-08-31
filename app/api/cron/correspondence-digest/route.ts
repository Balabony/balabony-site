import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'

/**
 * Звірка реєстру листування. Запускається Vercel Cron 1 і 15 числа.
 *
 * Лист надходить завжди, навіть коли прострочень немає, — інакше тиша
 * читається двозначно: чи все гаразд, чи cron просто не спрацював.
 *
 * Захист: у продакшені Vercel надсилає заголовок Authorization з
 * CRON_SECRET. Ручний запуск — той самий заголовок або cookie адмінки.
 *
 * Прострочені й ті, у кого строк спливає, показуються повністю — саме
 * вони потребують дії. Решта обрізається до десяти рядків, інакше лист
 * перетворюється на стіну тексту, яку перестають відкривати.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const TO = process.env.CORRESPONDENCE_DIGEST_TO ?? 'nazar@balabony.com'
const FROM = process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'
const SITE = 'https://balabony.com'

const KIND_LABEL: Record<string, string> = {
  edits_objection: 'заперечення проти правок',
  archive_objection: 'заперечення щодо архівного твору',
  withdrawal: 'відкликання',
  contract: 'договір',
  general: 'інше',
}

type Row = {
  number: string
  direction: string
  kind: string
  subject: string | null
  author_name: string | null
  author_email: string | null
  happened_at: string
  due_at: string | null
  days_left: number | null
}

const SQL = `
  select c.number,
         c.direction,
         c.kind,
         c.subject,
         p.display_name as author_name,
         c.author_email,
         c.happened_at,
         c.due_at,
         case when c.due_at is null then null
              else floor(extract(epoch from (c.due_at - now())) / 86400)::int
         end as days_left
    from correspondence c
    left join author_profiles p on p.user_id = c.author_id
   where c.answered_at is null
   order by c.due_at nulls last, c.happened_at
`

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true
  const pass = process.env.ADMIN_PASSWORD
  if (pass && req.cookies.get('admin_session')?.value === pass) return true
  return false
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const dt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

function block(title: string, rows: Row[], color: string, limit?: number): string {
  if (rows.length === 0) return ''
  const shown = limit === undefined ? rows : rows.slice(0, limit)
  const hidden = rows.length - shown.length
  const items = shown
    .map((r) => {
      const who = esc(r.author_name ?? r.author_email ?? 'без профілю')
      const what = esc(r.subject ?? KIND_LABEL[r.kind] ?? r.kind)
      const when =
        r.days_left === null
          ? 'без строку'
          : r.days_left < 0
            ? `прострочено на ${Math.abs(r.days_left)} дн.`
            : `лишилось ${r.days_left} дн., до ${dt(r.due_at)}`
      return `<li style="margin:0 0 10px 0;line-height:1.6">
        <b>${esc(r.number)}</b> · ${who}<br>
        <span style="color:#555">${what} — ${when}</span>
      </li>`
    })
    .join('')

  const tail =
    hidden > 0
      ? `<p style="color:#777;font-size:13px;margin:6px 0 0">…і ще ${hidden}. Повний перелік — у реєстрі.</p>`
      : ''

  return `<h3 style="color:${color};font-size:15px;margin:22px 0 10px">${title} — ${rows.length}</h3>
    <ul style="padding-left:18px;margin:0">${items}</ul>${tail}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  let rows: Row[]
  try {
    const r = await dbQuery(SQL, [])
    rows = (r.rows ?? []) as Row[]
  } catch {
    return NextResponse.json({ ok: false, error: 'Помилка бази' }, { status: 500 })
  }

  const overdue = rows.filter((r) => r.days_left !== null && r.days_left < 0)
  const soon = rows.filter((r) => r.days_left !== null && r.days_left >= 0 && r.days_left <= 3)
  const rest = rows.filter((r) => r.days_left === null || r.days_left > 3)

  const today = new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })

  const head =
    overdue.length > 0
      ? `<p style="font-size:15px;margin:0 0 4px"><b style="color:#c0392b">Прострочено: ${overdue.length}</b></p>`
      : `<p style="font-size:15px;margin:0 0 4px">Прострочених звернень немає.</p>`

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1c1917;max-width:640px">
    <h2 style="font-size:19px;margin:0 0 6px">Звірка листування з авторами</h2>
    <p style="color:#666;font-size:13px;margin:0 0 16px">Станом на ${today}</p>
    ${head}
    <p style="color:#666;font-size:13px;margin:0 0 8px">Без відповіді всього: ${rows.length}</p>
    ${block('Прострочені', overdue, '#c0392b')}
    ${block('Строк спливає протягом трьох днів', soon, '#b8860b')}
    ${block('Решта без відповіді', rest, '#555', 10)}
    <p style="margin:26px 0 0">
      <a href="${SITE}/admin/correspondence" style="background:#ef9f27;color:#1c1917;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:700;display:inline-block">Відкрити реєстр</a>
    </p>
    <p style="color:#999;font-size:12px;margin-top:22px;line-height:1.6">
      Строки: 14 днів на заперечення проти редакційних правок (п. 3.1-2),
      30 днів на заперечення щодо архівного твору (п. 2.4-1).
    </p>
  </div>`

  const key = process.env.RESEND_API_KEY
  if (!key) {
    return NextResponse.json({
      ok: false,
      error: 'RESEND_API_KEY не налаштовано',
      counts: { total: rows.length, overdue: overdue.length, soon: soon.length },
    })
  }

  try {
    await new Resend(key).emails.send({
      from: FROM,
      to: TO,
      subject:
        overdue.length > 0
          ? `Звірка листування: прострочено ${overdue.length}`
          : 'Звірка листування: прострочень немає',
      html,
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Не вдалося надіслати лист' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    sent_to: TO,
    counts: { total: rows.length, overdue: overdue.length, soon: soon.length, rest: rest.length },
  })
}
