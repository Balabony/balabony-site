import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { findContest } from '@/lib/contests'

/**
 * Нагадування авторам про обкладинку (14.10.2026).
 *
 * Через 5 днів після запиту (cover_requested_at; якщо порожньо — дата подачі)
 * автор, який не дав ні опису героїв, ні власної обкладинки, отримує ОДИН лист:
 * «якщо до {строку} нічого не буде — редакція створить обкладинку сама».
 * Після листа ставиться cover_reminded_at, тож повторно не надсилається.
 * Строк = за 9 днів до першої публікації конкурсу (03.11 → 25.10).
 */

const SITE = 'https://balabony.com'
const REPLY_TO = 'nazar@balabony.com'

function esc(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function deadlineFor(contestId: string): string | null {
  const from = findContest(contestId)?.stages.publishFrom
  if (!from) return null
  const d = new Date(`${from}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 9)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`
}

type Row = { id: string; email: string; author_name: string | null; title: string; contest: string; entry_number: number | null }

/** Повертає перелік «кому надіслано» для звіту засновнику. */
export async function sendCoverReminders(): Promise<string[]> {
  const r = await dbQuery(
    `select e.id::text, e.email, e.author_name, e.title, e.contest, e.entry_number
       from contest_entries e
      where e.status <> 'rejected'
        and coalesce(nullif(trim(e.cover_brief), ''), nullif(e.cover_url, '')) is null
        and e.cover_reminded_at is null
        -- 21.10.2026: обкладинку могли поставити прямо на серії (сторінка редагування твору),
        -- а не через «Оцінки конкурсів» — тоді в заявці cover_url порожній. Таким не нагадуємо.
        and not exists (
          select 1 from contest_episodes ep join content c on c.id = ep.content_id
           where ep.entry_id = e.id and coalesce(c.cover_url, '') <> ''
        )
        and coalesce(e.cover_requested_at, e.created_at) < now() - interval '5 days'
        and coalesce(e.email, '') <> ''`,
  )
  const sent: string[] = []
  const resend = new Resend(process.env.RESEND_API_KEY)
  for (const e of r.rows as Row[]) {
    const c = findContest(e.contest)
    // Публікацію вже почато — нагадувати пізно, обкладинку робить редакція.
    if (c?.stages.publishFrom && new Date(`${c.stages.publishFrom}T00:00:00Z`) <= new Date()) continue
    const until = deadlineFor(e.contest)
    const html = `<!DOCTYPE html><html lang="uk"><body style="margin:0;padding:24px;background:#081420;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#0f1f38;border-radius:14px;padding:28px;color:#f5f0e8;line-height:1.7;font-size:16px;">
<p>Доброго дня!</p>
<p>Нагадуємо про обкладинку для вашої роботи${e.entry_number ? ` № ${e.entry_number}` : ''} «${esc(e.title)}» (${esc(c?.name ?? e.contest)}).</p>
<p>Ми поки не отримали ні опису головних героїв, ні вашої обкладинки. Надішліть, будь ласка, у відповідь на цей лист:</p>
<p>— опис 1–3 головних героїв: ім'я й вік, зовнішність, одяг, характерна деталь; де відбувається дія і який настрій обкладинки;<br>
— або власну обкладинку: щонайменше 1200 пікселів завширшки, без тексту, лише зображення, на які ви маєте право. Сайт показує обкладинку і в широкій картці каталогу, і на високій сторінці твору, тож головних героїв розмістіть ближче до центру кадру.</p>
<p>Якщо${until ? ` до ${until}` : ' найближчим часом'} нічого не надійде, редакція створить обкладинку самостійно за текстом твору. На оцінку журі це не впливає.</p>
<p>З повагою,<br>Команда Балабонів</p>
</div>
<p style="font-size:11px;color:#445566;text-align:center;">${SITE}</p>
</body></html>`
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
        to: e.email,
        replyTo: REPLY_TO,
        subject: `Обкладинка для «${e.title}»: чекаємо до ${until ?? 'публікації'}`,
        html,
      })
      await dbQuery(`update contest_entries set cover_reminded_at = now() where id::text = $1`, [e.id])
      sent.push(`Нагадування про обкладинку: «${e.title}» → ${e.email}`)
    } catch (err) {
      console.error('[cover-reminder]', (err as Error)?.message)
    }
  }
  return sent
}
