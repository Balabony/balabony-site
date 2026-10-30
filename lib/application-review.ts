// =============================================================================
// ЗАЯВКИ АВТОРІВ → РЕДАКТОРИ (рішення Богдана 30.10.2026: «зроби як в конкурсах»)
//
// Кнопка «Надіслати редакторам» в /admin/zayavky-avtoriv призначає заявку
// всім редакторам з правом оцінювати (editors.can_judge — Оксана й Тетяна)
// і надсилає кожній лист. Заявка з’являється в кабінеті редактора (/editor):
// текст, відповіді на запитання і форма «Приймати / Доопрацювати / Відхилити».
// Відгук приходить Богданові листом і видно в картці заявки.
//
// Рішення (прийняти/відхилити, лист автору) лишається за адмінкою — редактор
// лише радить. Імені автора редактор не бачить, як і в конкурсах.
// =============================================================================

import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { EDITOR_EMAIL, esc } from '@/lib/author-applications'

const SITE = 'https://balabony.com'

export const VERDICTS = {
  accept: 'Приймати',
  revise: 'Приймати після доопрацювання',
  reject: 'Відхилити',
} as const
export type Verdict = keyof typeof VERDICTS

export async function ensureReviewTable(): Promise<void> {
  await dbQuery(`create table if not exists application_reviews (
    id serial primary key,
    application_id integer not null,
    editor_id integer not null,
    assigned_at timestamptz not null default now(),
    verdict text,
    comment text,
    responded_at timestamptz,
    unique (application_id, editor_id)
  )`)
}

export type ReviewRow = { editor: string; verdict: Verdict | null; comment: string | null; at: string | null }

/** Призначає заявку редакторам з правом оцінювати. Повторно нікого не дублює. */
export async function sendApplicationToEditors(appId: string): Promise<{ sent: string[]; already: string[] }> {
  await ensureReviewTable()
  const a = await dbQuery(`select id::text, title, genre, words from author_applications where id = $1`, [appId])
  const app = a.rows[0] as { id: string; title: string; genre: string | null; words: number } | undefined
  if (!app) throw new Error('Заявку не знайдено')

  const eds = await dbQuery(`select id, name, email from editors where can_judge order by name`)
  const sent: string[] = [], already: string[] = []
  for (const ed of eds.rows as { id: number; name: string; email: string }[]) {
    const ins = await dbQuery(
      `insert into application_reviews (application_id, editor_id) values ($1, $2)
       on conflict (application_id, editor_id) do nothing returning id`,
      [appId, ed.id],
    )
    if (!ins.rowCount) { already.push(ed.name); continue }
    await mail(ed.email, `[Балабони] Нова заявка автора на оцінку: «${app.title}»`, `
      <p style="color:#c8d4e8;line-height:1.7;">Вітаємо, <strong style="color:#f5f0e8;">${esc(ed.name)}</strong>!</p>
      <p style="color:#c8d4e8;line-height:1.7;">Вам скеровано історію нового автора:</p>
      <p style="color:#f5f0e8;line-height:1.7;font-size:16px;"><strong>«${esc(app.title)}»</strong><br><span style="color:#8899bb;">${esc(app.genre ?? '')}${app.genre ? ' · ' : ''}${app.words} слів</span></p>
      <p style="color:#c8d4e8;line-height:1.7;">Прочитайте й порадьте: приймати, приймати після доопрацювання чи відхилити. Текст і форма — у кабінеті.</p>
      <a href="${SITE}/editor/zayavka/${app.id}" style="display:block;text-align:center;background:#f0a500;color:#081420;padding:15px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin:20px 0;">Відкрити заявку</a>
      <p style="font-size:13px;color:#8899bb;line-height:1.6;margin:0;">Якщо попросить увійти — введіть свою пошту, посилання для входу прийде листом.</p>`)
    sent.push(ed.name)
  }
  return { sent, already }
}

/** Лист Богданові, коли редактор дав відгук. */
export async function mailVerdictToAdmin(p: { editor: string; appId: string; title: string; verdict: Verdict; comment: string }) {
  await mail(EDITOR_EMAIL, `[Балабони] ${p.editor}: «${p.title}» — ${VERDICTS[p.verdict]}`, `
    <p style="color:#c8d4e8;line-height:1.7;">Відгук редактора <strong style="color:#f5f0e8;">${esc(p.editor)}</strong> на заявку #${esc(p.appId)} «${esc(p.title)}»:</p>
    <p style="color:#ef9f27;font-size:17px;font-weight:700;">${VERDICTS[p.verdict]}</p>
    <p style="color:#c8d4e8;line-height:1.7;white-space:pre-wrap;">${esc(p.comment)}</p>
    <p style="color:#c8d4e8;line-height:1.7;">Вирішити: <a href="${SITE}/admin/zayavky-avtoriv" style="color:#ef9f27">${SITE}/admin/zayavky-avtoriv</a></p>`)
}

async function mail(to: string, subject: string, inner: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !to) return
  const html = `<!DOCTYPE html><html lang="uk"><body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:600px;margin:0 auto;">
<div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(240,165,0,0.3);">
  <div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:4px;">Balabony</div>
  <div style="font-size:11px;color:#8899bb;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">Заявки авторів</div>
  ${inner}
</div>
<p style="font-size:11px;color:#445566;margin-top:18px;text-align:center;">Команда Балабонів</p>
</body></html>`
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com', to, subject, html,
    })
  } catch (e) {
    console.error('[application-review] mail', (e as Error)?.message)
  }
}
