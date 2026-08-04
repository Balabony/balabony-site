import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { renderAuthorEmail, renderCustomEmail, type AuthorEmailTemplate } from '@/lib/author-emails'

/**
 * Надсилання листа одному авторові з адмінки.
 *
 * Надсилаємо по одному, свідомо. Масова розсилка з непрогрітого домену —
 * найшвидший спосіб отримати весь список у спамі, а разом із ним і всі
 * майбутні листи платформи. Спершу переконуємось, що листи доходять.
 *
 * Кожна спроба, вдала чи ні, лягає в author_emails — інакше через тиждень
 * ніхто не згадає, кому вже писали.
 */

function isAdmin(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) return false
  return req.cookies.get('admin_session')?.value === pass
}

const TEMPLATES: AuthorEmailTemplate[] = ['intro']

/** Стани згоди, за яких писати не можна. */
const BLOCKED_CONSENT = ['refused', 'revoked']

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: 'Немає доступу' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'RESEND_API_KEY не налаштовано у змінних оточення Vercel' },
      { status: 500 },
    )
  }

  let body: { userId?: string; template?: string; subject?: string; text?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }

  const userId = String(body.userId ?? '').trim()
  const template = String(body.template ?? '') as AuthorEmailTemplate

  // Текст, відредагований вручну. Якщо його немає — беремо шаблон.
  const customText = String(body.text ?? '').trim()
  const customSubject = String(body.subject ?? '').trim()

  if (!userId) return NextResponse.json({ ok: false, error: 'Не вказано автора' }, { status: 400 })
  if (!customText && !TEMPLATES.includes(template)) {
    return NextResponse.json({ ok: false, error: 'Невідомий шаблон листа' }, { status: 400 })
  }
  if (customText && !customSubject) {
    return NextResponse.json({ ok: false, error: 'Порожня тема листа' }, { status: 400 })
  }

  // --- Профіль -----------------------------------------------------------
  let name = ''
  let email = ''
  let optedOut = false
  try {
    const r = await dbQuery(
      `select coalesce(p.display_name, '') as display_name,
              coalesce(p.email, u.email)   as email,
              coalesce(p.newsletter_opt_out, false) as newsletter_opt_out
         from author_profiles p
         left join auth.users u on u.id = p.user_id
        where p.user_id = $1
        limit 1`,
      [userId],
    )
    const row = r.rows[0] as
      { display_name: string; email: string | null; newsletter_opt_out: boolean } | undefined
    if (!row) return NextResponse.json({ ok: false, error: 'Автора не знайдено' }, { status: 404 })
    name = row.display_name
    email = String(row.email ?? '').trim()
    optedOut = Boolean(row.newsletter_opt_out)
  } catch (e) {
    const err = e as { message?: string }
    return NextResponse.json(
      { ok: false, error: `Не вдалося прочитати профіль: ${err?.message ?? ''}` },
      { status: 500 },
    )
  }

  if (!email) {
    return NextResponse.json({ ok: false, error: 'У автора не вказано пошту' }, { status: 400 })
  }

  // --- Відписка від розсилки ---------------------------------------------
  // Автор натиснув «Відписатись» у кабінеті. Це стосується листів редакції;
  // службові листи (вхід, договір, виплати) йдуть іншими шляхами й сюди не
  // потрапляють. Якщо колись знадобиться написати такому авторові у справі —
  // це має бути свідома дія людини, а не тихий обхід прапорця.
  if (optedOut) {
    return NextResponse.json(
      { ok: false, error: 'Автор відписався від розсилки — лист не надіслано' },
      { status: 409 },
    )
  }

  // --- Згода: відкликана або відмова — не пишемо -------------------------
  try {
    const c = await dbQuery(
      `select status::text as status
         from author_consents
        where scope = 'balabony' and lower(trim(author_name)) = lower(trim($1))
        order by happened_at desc nulls last, created_at desc
        limit 1`,
      [name],
    )
    const status = (c.rows[0] as { status?: string } | undefined)?.status
    if (status && BLOCKED_CONSENT.includes(status)) {
      return NextResponse.json(
        { ok: false, error: `Автор відмовив у згоді (${status}) — лист не надіслано` },
        { status: 409 },
      )
    }
  } catch {
    // Таблиці згод може не бути — це не привід блокувати відправлення.
  }

  const { subject, html, text } = customText
    ? renderCustomEmail(customSubject, customText, { name, email })
    : renderAuthorEmail(template, { name, email })

  // --- Відправлення -------------------------------------------------------
  const from = process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'
  let sendError: string | null = null

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const res = await resend.emails.send({ from, to: email, subject, html, text })
    if (res.error) sendError = res.error.message || 'Resend відхилив лист'
  } catch (e) {
    const err = e as { message?: string }
    sendError = err?.message ?? 'Невідома помилка надсилання'
  }

  // --- Журнал -------------------------------------------------------------
  try {
    await dbQuery(
      `insert into author_emails (author_id, email, template, subject, status, error)
       values ($1, $2, $3, $4, $5, $6)`,
      [userId, email, customText ? 'custom' : template, subject, sendError ? 'failed' : 'sent', sendError],
    )
  } catch {
    // Таблиці журналу ще немає — саме відправлення від цього не залежить.
  }

  if (sendError) {
    console.error('[send-author-email]', email, sendError)
    return NextResponse.json({ ok: false, error: sendError }, { status: 502 })
  }

  return NextResponse.json({ ok: true, email, subject })
}
