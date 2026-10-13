import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { sendProblemAlert } from '@/lib/problem-alert'

/**
 * Щоденна перевірка «що зависло» (14.10.2026), 10:00 за Києвом.
 * Лист Богдану лише тоді, коли є що робити:
 *   — заявки авторів у статусі «нова» довше 2 днів;
 *   — конкурсні роботи без номера або без редактора.
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
