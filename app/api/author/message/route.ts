import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'

/**
 * Лист від автора до редакції.
 *
 * Записується в author_messages і одразу летить редакції на пошту з Reply-To
 * автора: відповідати можна звичайним «Відповісти» зі своєї скриньки, без
 * жодного інтерфейсу в адмінці.
 *
 * Запис у базу робиться ПЕРШИМ. Якщо пошта не піде, звернення все одно не
 * загубиться — його буде видно в журналі.
 */

const TOPIC_LABEL: Record<string, string> = {
  works: 'Мої твори — додати або виправити',
  tech: 'Щось не працює',
  contract: 'Питання щодо договору',
  voice: 'Хочу записати свій голос',
  idea: 'Пропозиція щодо платформи',
  payout: 'Питання щодо виплат',
  other: 'Інше',
}

const MAX_LEN = 8000

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
    }

    let payload: { topic?: string; body?: string }
    try {
      payload = (await req.json()) as typeof payload
    } catch {
      return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
    }

    const topic = String(payload.topic ?? 'other')
    const body = String(payload.body ?? '').trim().slice(0, MAX_LEN)

    if (body.length < 10) {
      return NextResponse.json({ ok: false, error: 'Повідомлення закоротке' }, { status: 400 })
    }

    // --- Хто пише ---------------------------------------------------------
    let name = ''
    let email = ''
    try {
      const r = await dbQuery(
        `select coalesce(p.display_name, '') as display_name,
                coalesce(p.email, u.email)   as email
           from author_profiles p
           left join auth.users u on u.id = p.user_id
          where p.user_id = $1
          limit 1`,
        [user.id],
      )
      const row = r.rows[0] as { display_name: string; email: string | null } | undefined
      name = row?.display_name ?? ''
      email = String(row?.email ?? user.email ?? '').trim()
    } catch {
      email = String(user.email ?? '').trim()
    }

    // --- Не частіше ніж раз на хвилину -----------------------------------
    try {
      const recent = await dbQuery(
        `select 1 from author_messages
          where author_id = $1 and created_at > now() - interval '1 minute'
          limit 1`,
        [user.id],
      )
      if (recent.rowCount && recent.rowCount > 0) {
        return NextResponse.json(
          { ok: false, error: 'Ви щойно надіслали лист. Зачекайте хвилину, будь ласка.' },
          { status: 429 },
        )
      }
    } catch {
      // таблиці ще немає — пропускаємо перевірку
    }

    // --- Запис у базу ------------------------------------------------------
    try {
      await dbQuery(
        `insert into author_messages (author_id, author_name, email, topic, body)
         values ($1, $2, $3, $4, $5)`,
        [user.id, name, email, topic, body],
      )
    } catch (e) {
      const err = e as { message?: string }
      console.error('[author/message] db', err?.message)
      return NextResponse.json(
        { ok: false, error: 'Не вдалося зберегти звернення. Спробуйте пізніше.' },
        { status: 500 },
      )
    }

    // --- Лист редакції -----------------------------------------------------
    const to = process.env.EDITORIAL_INBOX ?? 'nazar@balabony.com'
    const from = process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'
    const label = TOPIC_LABEL[topic] ?? topic
    const who = name || email || 'автор'

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from,
          to,
          replyTo: email || undefined,
          subject: `[Автор] ${who} — ${label}`,
          text: `${who} <${email}>\nТема: ${label}\n\n${body}\n\n— — —\nНадіслано з кабінету автора на balabony.com`,
          html: `<!DOCTYPE html><html lang="uk"><body style="margin:0;padding:24px;background:#f4f4f5">
<div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:10px;padding:26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#18181b">
  <div style="font-size:13px;color:#71717a;margin-bottom:4px">Лист із кабінету автора</div>
  <div style="font-weight:700;font-size:17px">${escapeHtml(who)}</div>
  <div style="font-size:13px;color:#71717a;margin-bottom:14px">${escapeHtml(email)}</div>
  <div style="display:inline-block;padding:4px 10px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:13px;margin-bottom:16px">${escapeHtml(label)}</div>
  <div style="white-space:pre-wrap;border-top:1px solid #e4e4e7;padding-top:14px">${escapeHtml(body)}</div>
  <div style="border-top:1px solid #e4e4e7;margin-top:18px;padding-top:12px;font-size:12px;color:#71717a">
    Натисніть «Відповісти» — лист піде авторові.
  </div>
</div></body></html>`,
        })
      } catch (e) {
        const err = e as { message?: string }
        // Звернення вже в базі — мовчазна помилка пошти не втрачає його.
        console.error('[author/message] mail', err?.message)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const err = e as { message?: string }
    console.error('[author/message]', err?.message)
    return NextResponse.json({ ok: false, error: 'Помилка на сервері' }, { status: 500 })
  }
}
