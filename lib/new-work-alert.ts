// =============================================================================
// МИТТЄВЕ ПОВІДОМЛЕННЯ ПРО НОВІ ТВОРИ (рішення Богдана 14.10.2026).
//
// «Свічка» Наталії Яреми, додана в кабінеті 03.10, пролежала в чернетках
// 11 днів, бо про неї ніхто не знав. Тепер кожна дія автора, після якої
// у каталозі /admin/works з'являється щось нове, одразу шле лист на
// nazar@balabony.com: назва, автор, обсяг, жанр, посилання на редагування.
// «Відповісти» в листі — пише автору.
// =============================================================================

import { Resend } from 'resend'

const TO = 'nazar@balabony.com'
const SITE = 'https://balabony.com'

function esc(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export type NewWorkEvent = 'added' | 'published' | 'review'

const LABEL: Record<NewWorkEvent, string> = {
  added: 'Новий твір у кабінеті автора (чернетка)',
  published: 'Автор сам опублікував твір',
  review: 'Автор надіслав серію на редактуру',
}

export async function sendNewWorkAlert(p: {
  event: NewWorkEvent
  id: string
  title: string
  author?: string | null
  email?: string | null
  words?: number | null
  genre?: string | null
}) {
  if (!process.env.RESEND_API_KEY) return
  // 14.10.2026: додані й опубліковані твори — тепер в одному щоденному листі (lib/new-works-digest.ts).
  // Окремим листом лишається тільки серія на редактуру — її треба взяти в роботу.
  if (p.event !== 'review') return
  const time = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
  const html = `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:24px;max-width:640px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:14px;padding:22px;border:1px solid rgba(239,159,39,.5);">
    <div style="font-size:13px;color:#ef9f27;margin-bottom:6px;">${esc(LABEL[p.event])}</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:12px;">«${esc(p.title)}»</div>
    <p style="color:#c8d4e8;margin:0 0 6px;"><b>Автор:</b> ${esc(p.author ?? '—')}${p.email ? ` · <a href="mailto:${esc(p.email)}" style="color:#ef9f27">${esc(p.email)}</a>` : ''}</p>
    <p style="color:#c8d4e8;margin:0 0 6px;"><b>Обсяг:</b> ${p.words ?? '—'} слів${p.genre ? ` · <b>Жанр:</b> ${esc(p.genre)}` : ''}</p>
    <a href="${SITE}/admin/content/stories/${esc(p.id)}/edit" style="display:inline-block;margin-top:12px;background:#ef9f27;color:#0a1628;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Відкрити твір</a>
    <a href="${SITE}/admin/works" style="display:inline-block;margin:12px 0 0 10px;color:#ef9f27;">Каталог творів</a>
    <p style="color:#8899bb;font-size:12px;margin:14px 0 0;">${esc(time)} · «Відповісти» — лист піде автору.</p>
  </div>
</body>`
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
      to: TO,
      ...(p.email ? { replyTo: p.email } : {}),
      subject: `[Балабони] Серія на редактуру: «${p.title.slice(0, 80)}» — ${p.author ?? ''}`,
      html,
    })
  } catch (e) {
    console.error('[new-work-alert]', (e as Error)?.message)
  }
}

/** Дані твору з бази для листа (коли в роуті їх немає під рукою). */
export async function alertForContent(event: NewWorkEvent, id: string, email?: string | null) {
  try {
    const { dbQuery } = await import('@/lib/db')
    const r = await dbQuery(
      `select id::text, title, author_name, genre,
              array_length(regexp_split_to_array(trim(coalesce(text,'')), '\\s+'), 1) as words
         from content where id::text = $1`,
      [id],
    )
    const row = r.rows[0] as { id: string; title: string; author_name: string | null; genre: string | null; words: number | null } | undefined
    if (!row) return
    await sendNewWorkAlert({ event, id: row.id, title: row.title ?? 'Без назви', author: row.author_name, email, words: row.words, genre: row.genre })
  } catch (e) {
    console.error('[new-work-alert content]', (e as Error)?.message)
  }
}
