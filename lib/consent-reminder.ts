import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'

/**
 * 11.11.2026: автоматичне нагадування про згоду на публікацію.
 * Твір у графіку без згоди автора не вийде (тригер check_publish_consent) — 5 оповідань
 * Анни Войченко застрягли саме так. Тепер щодня:
 *   — автору, чий твір виходить у найближчі 14 днів без згоди, — ОДИН лист на твір;
 *   — засновнику — перелік творів без згоди, що виходять за 3 дні або вже прострочені.
 * Згоду автор дає в кабінеті кнопкою «Дати згоду на публікацію».
 */

const SITE = 'https://balabony.com'
const esc = (v: string) => (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const NO_CONSENT = `
  c.status = 'scheduled' and c.publish_at is not null
  and not exists (select 1 from publish_consents pc where pc.content_id = c.id)
  and coalesce((select max(acc.status::text) from author_consent_current acc
                 where acc.author_name = c.author_name and acc.scope::text = 'balabony'), '') <> 'given'`

type Row = { id: string; title: string; author_name: string | null; email: string | null; publish_at: string }

export async function sendConsentReminders(): Promise<{ sent: string[]; urgent: string[] }> {
  await dbQuery(`create table if not exists consent_reminders (content_id uuid primary key, sent_at timestamptz not null default now())`)
  await dbQuery(`alter table consent_reminders enable row level security`)
  const r = await dbQuery(
    `select c.id::text, c.title, c.author_name, u.email, c.publish_at
       from content c left join auth.users u on u.id = c.author_id
      where ${NO_CONSENT}
        and c.publish_at < now() + interval '14 days'
        and not exists (select 1 from consent_reminders cr where cr.content_id = c.id)
      order by c.publish_at`,
  )
  // Один лист на автора, у ньому — усі його твори без згоди.
  const byMail = new Map<string, Row[]>()
  for (const x of r.rows as Row[]) {
    if (!x.email) continue
    byMail.set(x.email, [...(byMail.get(x.email) ?? []), x])
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const sent: string[] = []
  for (const [email, works] of byMail) {
    const list = works.map((w) => `<li>«${esc(w.title)}» — вихід ${new Date(w.publish_at).toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv' })}</li>`).join('')
    const html = `<!DOCTYPE html><html lang="uk"><body style="margin:0;padding:24px;background:#081420;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#0f1f38;border-radius:14px;padding:28px;color:#f5f0e8;line-height:1.7;font-size:16px;">
<p>Доброго дня!</p>
<p>Ваші твори стоять у графіку публікацій на «Балабонах», але сайт не може опублікувати їх без вашої згоди:</p>
<ul>${list}</ul>
<p>Будь ласка, зайдіть у кабінет, під кожним твором поставте галочку й натисніть <b>«Дати згоду на публікацію»</b>. Це хвилина — і твори вийдуть за графіком.</p>
<p><a href="${SITE}/author/dashboard" style="display:inline-block;background:#ef9f27;color:#1a1206;padding:12px 20px;border-radius:10px;font-weight:700;text-decoration:none;">Відкрити кабінет</a></p>
<p>З повагою,<br>редакція «Балабонів»</p></div></body></html>`
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
        to: email,
        replyTo: 'nazar@balabony.com',
        subject: works.length > 1 ? 'Потрібна ваша згода на публікацію творів' : `«${works[0].title}» — потрібна ваша згода на публікацію`,
        html,
      })
      for (const w of works) await dbQuery(`insert into consent_reminders (content_id) values ($1) on conflict do nothing`, [w.id])
      sent.push(`${works[0].author_name ?? email} (${works.length})`)
    } catch (err) { console.error('[consent-reminder]', email, (err as Error)?.message) }
  }
  const u = await dbQuery(
    `select c.title, c.author_name, c.publish_at from content c
      where ${NO_CONSENT} and c.publish_at < now() + interval '3 days' order by c.publish_at`,
  )
  const urgent = (u.rows as Row[]).map((x) =>
    `«${x.title}» (${x.author_name ?? '—'}) — ${new Date(x.publish_at) < new Date() ? 'ПРОСТРОЧЕНО' : 'вихід ' + new Date(x.publish_at).toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv' })}`)
  return { sent, urgent }
}
