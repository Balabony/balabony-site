// =============================================================================
// ЗАЯВКИ АВТОРІВ → РЕДАКТОРИ (рішення Богдана 30.10.2026: «зроби як в конкурсах»)
//
// Кнопка «Надіслати редакторам» в /admin/zayavky-avtoriv призначає заявку
// всім редакторам з правом оцінювати (editors.can_judge — Оксана й Тетяна)
// і надсилає кожній лист. Заявка з’являється в кабінеті редактора (/editor):
// текст, відповіді на запитання і форма «Приймати / Доопрацювати / Відхилити».
// Відгук приходить Богданові листом і видно в картці заявки.
//
// Рішення (прийняти/відхилити, лист автору) з 18.11.2026 ухвалює редактор сам (рішення Богдана);
// раніше лише радив, а рішення лишалося за адмінкою. Імені автора редактор не бачить, як і в конкурсах.
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

/**
 * 25.11.2026 (Богдан: «віддавай все редакторам»): щоденна перевірка більше не кидає заявки авторів Богданові.
 *  — заявка «нова» довше 2 днів і редакторам ще не призначена → призначаємо зараз (крім підозри на ШІ);
 *  — призначена, але редактор ще не відповів → тому редактору один лист-нагадування;
 *  — Богданові лишається лише те, що справді його: підозра на ШІ (обидві системи ≥ порога, п. 8.11)
 *    і рішення редактора, яке не вдалося виконати (є відгук, заявка досі «нова»).
 */
export async function routeStaleApplications(): Promise<{ lines: string[]; report: string[] }> {
  await ensureReviewTable()
  await dbQuery(`create table if not exists ai_authorship_alerts (
    source text not null, source_id text not null, sent_at timestamptz not null default now(),
    primary key (source, source_id))`)
  const apps = await dbQuery(
    `select a.id::text as id, a.title, a.full_name, a.created_at,
            exists (select 1 from ai_authorship_alerts x where x.source = 'application' and x.source_id = a.id::text) as ai_hold,
            (select count(*) from application_reviews rv where rv.application_id = a.id)::int as assigned,
            (select count(*) from application_reviews rv where rv.application_id = a.id and rv.verdict is not null)::int as answered
       from author_applications a
      where a.status = 'new' and a.created_at < now() - interval '2 days'
      order by a.created_at`,
  )
  const lines: string[] = [], report: string[] = []
  type A = { id: string; title: string; full_name: string; created_at: string; ai_hold: boolean; assigned: number; answered: number }
  const waiting = new Map<string, { name: string; items: { id: string; title: string; days: number }[] }>()
  for (const a of apps.rows as A[]) {
    const days = Math.floor((Date.now() - new Date(a.created_at).getTime()) / 86400000)
    if (a.ai_hold) { lines.push(`Заявка автора #${a.id} «${a.title}» (${a.full_name}) — підозра на ШІ, рішення за Вами, чекає ${days} дн. — ${SITE}/admin/zayavky-avtoriv`); continue }
    if (!a.assigned) {
      try {
        const r = await sendApplicationToEditors(a.id)
        report.push(`заявка #${a.id} «${a.title}» → ${r.sent.join(', ') || 'нікому (немає редакторів з правом оцінювати)'}`)
        if (!r.sent.length) lines.push(`Заявка автора #${a.id} «${a.title}» (${a.full_name}) — немає редакторів, яким її віддати — ${SITE}/admin/zayavky-avtoriv`)
      } catch (err) {
        console.error('[routeStale assign]', a.id, (err as Error)?.message)
        lines.push(`Заявка автора #${a.id} «${a.title}» (${a.full_name}) — не вдалося віддати редакторам — ${SITE}/admin/zayavky-avtoriv`)
      }
      continue
    }
    if (a.answered > 0) { lines.push(`Заявка автора #${a.id} «${a.title}» (${a.full_name}) — редактор відповів, але рішення не виконано, чекає ${days} дн. — ${SITE}/admin/zayavky-avtoriv`); continue }
    const rv = await dbQuery(
      `select ed.email, ed.name from application_reviews r join editors ed on ed.id = r.editor_id
        where r.application_id = $1 and r.verdict is null`, [a.id])
    for (const e of rv.rows as { email: string; name: string }[]) {
      const w = waiting.get(e.email) ?? { name: e.name, items: [] }
      w.items.push({ id: a.id, title: a.title, days })
      waiting.set(e.email, w)
    }
  }
  for (const [email, w] of waiting) {
    const list = w.items.map((i) => `<li><a href="${SITE}/editor/zayavka/${i.id}" style="color:#ef9f27">«${esc(i.title)}»</a> — чекає ${i.days} дн.</li>`).join('')
    await mail(email, `[Балабони] Заявки авторів чекають Вашого рішення: ${w.items.length}`, `
      <p style="color:#c8d4e8;line-height:1.7;">Вітаємо, <strong style="color:#f5f0e8;">${esc(w.name)}</strong>!</p>
      <p style="color:#c8d4e8;line-height:1.7;">Ці заявки нових авторів чекають Вашого рішення (прийняти, після доопрацювання чи відхилити):</p>
      <ul style="color:#c8d4e8;line-height:1.9;">${list}</ul>
      <p style="font-size:13px;color:#8899bb;line-height:1.6;margin:0;">Автор чекає на відповідь. Рішення ухвалюєте Ви — автору одразу піде лист.</p>`)
    report.push(`нагадування ${w.name}: ${w.items.length}`)
  }
  return { lines, report }
}

/** Лист Богданові, коли редактор ухвалив рішення (з 18.11.2026 — остаточне; outcome null — рішення не вдалося виконати). */
export async function mailVerdictToAdmin(p: { editor: string; appId: string; title: string; verdict: Verdict; comment: string; outcome?: 'accepted' | 'rejected' | null }) {
  const done = p.outcome === 'accepted' ? 'Заявку ПРИЙНЯТО, автору надіслано лист, чернетку створено.' : p.outcome === 'rejected' ? 'Заявку ВІДХИЛЕНО, автору надіслано лист.' : 'УВАГА: рішення не виконано (помилка), заявка досі «нова» — перегляньте її.'
  await mail(EDITOR_EMAIL, `[Балабони] ${p.editor}: «${p.title}» — ${VERDICTS[p.verdict]}`, `
    <p style="color:#c8d4e8;line-height:1.7;">Рішення редактора <strong style="color:#f5f0e8;">${esc(p.editor)}</strong> на заявку #${esc(p.appId)} «${esc(p.title)}»:</p>
    <p style="color:#ef9f27;font-size:17px;font-weight:700;">${VERDICTS[p.verdict]}</p>
    <p style="color:#c8d4e8;line-height:1.7;white-space:pre-wrap;">${esc(p.comment)}</p>
    <p style="color:#ef9f27;line-height:1.7;">${done}</p>
    <p style="color:#c8d4e8;line-height:1.7;">Заявки: <a href="${SITE}/admin/zayavky-avtoriv" style="color:#ef9f27">${SITE}/admin/zayavky-avtoriv</a></p>`)
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
