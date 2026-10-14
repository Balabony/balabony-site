import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { CONTESTS } from '@/lib/contests'

/**
 * Нагадування редакторам за 3 дні до строку оцінювання (14.10.2026).
 *
 * Строк — stages.scoresUntil конкурсу. Рівно за 3 дні (за київським часом)
 * кожен редактор, у якого лишилися не подані оцінки цього конкурсу, отримує
 * ОДИН лист з переліком робіт. Щоденний cron запускається раз на добу,
 * тому лист приходить один раз без окремої позначки в базі.
 */

const SITE = 'https://balabony.com'
const REPLY_TO = 'nazar@balabony.com'

function esc(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function kyivToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })
}
function minusDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}
function fmt(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

type Row = { editor_email: string; editor_name: string | null; entry_number: number | null; title: string }

/** Повертає перелік «кому надіслано» для звіту засновнику. */
export async function sendEditorDeadlineReminders(): Promise<string[]> {
  const today = kyivToday()
  const due = CONTESTS.filter((c) => c.stages.scoresUntil && minusDays(c.stages.scoresUntil, 3) === today)
  const sent: string[] = []
  if (!due.length) return sent
  const resend = new Resend(process.env.RESEND_API_KEY)

  for (const c of due) {
    const r = await dbQuery(
      `select ed.email as editor_email, ed.name as editor_name, e.entry_number, e.title
         from contest_assignments a
         join editors ed on ed.id = a.editor_id
         join contest_entries e on e.id = a.entry_id
        where e.contest = $1 and e.status <> 'rejected'
          and not exists (select 1 from contest_scores s
                           where s.entry_id = a.entry_id and s.editor_id = a.editor_id and s.status = 'submitted')
        order by ed.email, e.entry_number nulls last`,
      [c.id],
    )
    const byEditor = new Map<string, Row[]>()
    for (const row of r.rows as Row[]) {
      if (!row.editor_email) continue
      const list = byEditor.get(row.editor_email) ?? []
      list.push(row)
      byEditor.set(row.editor_email, list)
    }
    const until = fmt(c.stages.scoresUntil as string)
    for (const [email, rows] of byEditor) {
      const name = (rows[0].editor_name ?? '').trim()
      const items = rows.map((x) => `<li>№ ${x.entry_number ?? '—'} · «${esc(x.title)}»</li>`).join('')
      const html = `<!DOCTYPE html><html lang="uk"><body style="margin:0;padding:24px;background:#081420;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#0f1f38;border-radius:14px;padding:28px;color:#f5f0e8;line-height:1.7;font-size:16px;">
<p>Доброго дня${name ? `, ${esc(name)}` : ''}!</p>
<p>Нагадуємо: строк подати оцінки в конкурсі ${esc(c.name)} — <b>${until}</b>, лишилося 3 дні.</p>
<p>Ще не подано оцінок (${rows.length}):</p>
<ul>${items}</ul>
<a href="${SITE}/editor/login" style="display:block;text-align:center;background:#f0a500;color:#081420;padding:15px 20px;border-radius:10px;text-decoration:none;font-weight:700;margin:20px 0;">Відкрити кабінет редактора</a>
<p style="font-size:14px;color:#c8d4e8;">Якщо не встигаєте — напишіть у відповідь на цей лист, домовимося.</p>
<p>Команда Балабонів</p>
</div></body></html>`
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
          to: email,
          replyTo: REPLY_TO,
          subject: `[Балабони] 3 дні до строку оцінювання: ${rows.length} робіт`,
          html,
        })
        sent.push(`Редактору ${name || email} (${email}): ${rows.length} не поданих оцінок, ${c.name}, строк ${until}`)
      } catch (err) {
        console.error('[editor-deadline]', (err as Error)?.message)
      }
    }
  }
  return sent
}
