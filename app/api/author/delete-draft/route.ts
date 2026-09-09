import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { Resend } from 'resend'

/**
 * Автор видаляє власну чернетку: /api/author/delete-draft
 *
 * Навіщо. Помилково вставлений не той текст або дубль автор прибрати не міг —
 * лишалося писати редакції. Після появи форми додавання (09.09.2026) таких
 * випадків стане більше.
 *
 * ТІЛЬКИ чернетки. Опублікований твір авторові тут видалити не можна, і це
 * свідомо: на нього вже стоять посилання, прочитання в `article_reads` (з яких
 * рахується винагорода) і, можливо, голоси за озвучення. Зняти твір з
 * публікації — окрема розмова з редакцією, а не кнопка.
 *
 * Видаляємо назавжди, не міняючи статус: чернетка, яку автор прибрав, не має
 * лишатися в базі привидом і спливати в підрахунках творів за договором.
 *
 * Але текст перед видаленням летить листом авторові й у копію редакції.
 * Рядок у базі — не єдина копія: автор, який стер не той твір, знайде його в
 * своїй скриньці. Це дешевша страховка, ніж статус `deleted`, який довелося б
 * виключати в кожному підрахунку творів за договором і в кожному ручному SQL.
 */

export const runtime = 'nodejs'

/** Скільки тексту кладемо в лист. Повний твір буває на 200 000 знаків —
 *  для відновлення випадково стертого досить першої частини, а скриньку
 *  такий лист не забиває. */
const COPY_LIMIT = 20000

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function sendCopy(title: string, text: string, authorEmail: string) {
  if (!process.env.RESEND_API_KEY) return
  const editorial = process.env.EDITORIAL_INBOX ?? 'nazar@balabony.com'
  const from = process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com'
  const cut = text.length > COPY_LIMIT
  const body = cut ? text.slice(0, COPY_LIMIT) : text

  const to = authorEmail ? [authorEmail, editorial] : [editorial]
  const note = cut
    ? `У листі перші ${COPY_LIMIT} знаків із ${text.length}.`
    : 'Текст повністю.'

  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from,
      to,
      replyTo: editorial,
      subject: `Копія видаленої чернетки: ${title}`,
      text: [
        `Ви видалили чернетку «${title}» на balabony.com.`,
        'На сайті її більше немає — це копія тексту на випадок, якщо видалення було помилковим.',
        note,
        '',
        '— — —',
        '',
        body,
      ].join('\n'),
      html: `<!DOCTYPE html><html lang="uk"><body style="margin:0;padding:24px;background:#f4f4f5">
<div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:10px;padding:26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#18181b">
  <div style="font-size:13px;color:#71717a;margin-bottom:4px">Копія видаленої чернетки</div>
  <div style="font-weight:700;font-size:18px;margin-bottom:12px">${escapeHtml(title)}</div>
  <p style="margin:0 0 6px">На сайті цього твору більше немає. Копія — на випадок, якщо видалення було помилковим.</p>
  <div style="font-size:13px;color:#71717a;margin-bottom:16px">${escapeHtml(note)}</div>
  <div style="white-space:pre-wrap;border-top:1px solid #e4e4e7;padding-top:14px;font-size:14px;color:#3f3f46">${escapeHtml(body)}</div>
</div></body></html>`,
    })
  } catch (e) {
    console.error('[author/delete-draft] copy mail', (e as Error)?.message)
  }
}


export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })
  }

  let contentId = ''
  try {
    const b = (await req.json()) as { contentId?: string }
    contentId = String(b?.contentId ?? '').trim()
  } catch {
    return NextResponse.json({ ok: false, error: 'Некоректний запит' }, { status: 400 })
  }
  if (!contentId) {
    return NextResponse.json({ ok: false, error: 'Не вказано твір' }, { status: 400 })
  }

  try {
    const r = await dbQuery(
      `select id::text, author_id::text, status::text as status, title, text
         from content where id = $1 limit 1`,
      [contentId],
    )
    const row = r.rows[0] as
      { author_id: string | null; status: string; title: string; text: string | null } | undefined

    if (!row) {
      return NextResponse.json({ ok: false, error: 'Твір не знайдено' }, { status: 404 })
    }
    if (row.author_id !== user.id) {
      return NextResponse.json({ ok: false, error: 'Це не ваш твір' }, { status: 403 })
    }
    if (row.status !== 'draft') {
      return NextResponse.json(
        { ok: false, error: 'Видалити можна лише чернетку. Щоб зняти опублікований твір — напишіть нам.' },
        { status: 400 },
      )
    }

    // Прив'язані рядки прибираємо самі: у частини таблиць немає каскаду, і
    // без цього видалення впало б на зовнішньому ключі.
    await dbQuery(`delete from contract_works where content_id = $1`, [contentId]).catch(() => {})
    await dbQuery(`delete from voice_votes where content_id = $1`, [contentId]).catch(() => {})
    await dbQuery(`delete from content_likes where content_id = $1`, [contentId]).catch(() => {})

    await dbQuery(`delete from content where id = $1 and status::text = 'draft'`, [contentId])

    // Копія тексту в пошту. Після delete — щоб лист не пішов, якщо видалення
    // не вдалося. Саме await, а не fire-and-forget: serverless-функція на
    // Vercel завершується одразу після відповіді й обірвала б відправку.
    // Помилки пошти ковтає sendCopy — видалення вже сталося, скасувати нічого.
    await sendCopy(row.title, row.text ?? '', String(user.email ?? ''))

    return NextResponse.json({ ok: true, title: row.title })
  } catch (err) {
    console.error('[author/delete-draft]', (err as Error)?.message)
    return NextResponse.json(
      { ok: false, error: 'Не вдалося видалити. Спробуйте ще раз або напишіть на nazar@balabony.com' },
      { status: 500 },
    )
  }
}
