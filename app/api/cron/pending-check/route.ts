import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { sendProblemAlert } from '@/lib/problem-alert'
import { sendCoverReminders } from '@/lib/contest-cover-reminder'
import { sendEditorDeadlineReminders } from '@/lib/editor-deadline-reminder'
import { sendNewWorksDigest } from '@/lib/new-works-digest'

/**
 * Щоденна перевірка «що зависло» (14.10.2026), 10:00 за Києвом.
 * Лист Богдану лише тоді, коли є що робити:
 *   — заявки авторів у статусі «нова» довше 2 днів;
 *   — конкурсні роботи без номера або без редактора.
 * 14.10.2026: тут же — нагадування авторам про обкладинку через 5 днів
 * (lib/contest-cover-reminder.ts); засновник отримує перелік, кому пішло.
 * І редакторам — за 3 дні до строку оцінювання (lib/editor-deadline-reminder.ts).
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  try {
    const apps = await dbQuery(
      `select id::text, title, full_name, created_at from author_applications
        where status = 'new' and created_at < now() - interval '2 days' order by created_at`,
    )
    const entries = await dbQuery(
      `select e.id::text, e.title, e.contest from contest_entries e
        where e.status <> 'rejected'
          and (e.entry_number is null
               or not exists (select 1 from contest_assignments a where a.entry_id = e.id and a.role = 'primary'))`,
    )
    const lines: string[] = []
    for (const a of apps.rows as { id: string; title: string; full_name: string; created_at: string }[]) {
      const days = Math.floor((Date.now() - new Date(a.created_at).getTime()) / 86400000)
      lines.push(`Заявка автора #${a.id} «${a.title}» (${a.full_name}) чекає ${days} дн. — https://balabony.com/admin/zayavky-avtoriv`)
    }
    for (const e of entries.rows as { id: string; title: string; contest: string }[]) {
      lines.push(`Конкурсна робота #${e.id} «${e.title}» без номера або редактора — https://balabony.com/admin/ocinky-konkursiv`)
    }
    // 14.10.2026: щоденний лист про нові твори замість окремого листа на кожен.
    try { await sendNewWorksDigest() } catch (err) { console.error('[new-works-digest run]', (err as Error)?.message) }
    let edReminded: string[] = []
    try { edReminded = await sendEditorDeadlineReminders() } catch (err) { console.error('[editor-deadline run]', (err as Error)?.message) }
    if (edReminded.length) {
      await sendProblemAlert({
        where: 'нагадування редакторам — 3 дні до строку',
        error: `Надіслано ${edReminded.length} нагадувань редакторам`,
        extra: edReminded.join(' • '),
      })
    }
    let reminded: string[] = []
    try { reminded = await sendCoverReminders() } catch (err) { console.error('[cover-reminder run]', (err as Error)?.message) }
    if (reminded.length) {
      await sendProblemAlert({
        where: 'нагадування авторам про обкладинку',
        error: `Надіслано ${reminded.length} нагадувань. Якщо до строку відповіді не буде — обкладинку робимо самі.`,
        extra: reminded.join(' • '),
      })
    }
    if (lines.length) {
      await sendProblemAlert({
        where: 'щоденна перевірка — є незавершені справи',
        error: `${lines.length} пункт(ів) потребують уваги`,
        extra: lines.join(' • '),
      })
    }
    return NextResponse.json({ ok: true, items: lines.length })
  } catch (err) {
    console.error('[cron/pending-check]', (err as Error)?.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
