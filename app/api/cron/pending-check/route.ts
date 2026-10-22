import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { sendProblemAlert } from '@/lib/problem-alert'
import { sendCoverReminders } from '@/lib/contest-cover-reminder'
import { sendEditorDeadlineReminders } from '@/lib/editor-deadline-reminder'
import { sendNewWorksDigest } from '@/lib/new-works-digest'
import { dueInTwoDays } from '@/lib/contest-schedule'
import { sendCoverHowto } from '@/lib/cover-howto'
import { featuredCandidates, featuredThisWeek, setFeatured } from '@/lib/featured-author'
import { revalidatePath } from 'next/cache'

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
    // 14.10.2026: за два дні до виходу конкурсних серій — нагадування переглянути.
    try {
      const due = await dueInTwoDays()
      if (due.length) {
        await sendProblemAlert({
          kind: 'todo', where: 'конкурс — через 2 дні виходять серії',
          error: `Післязавтра о 18:00 вийде ${due.length} серій. Перегляньте тексти, поки є час.`,
          extra: due.map(d => `«${d.title}» (${d.author ?? 'автор не вказаний'}) — https://balabony.com/admin/content/stories/${d.id}/edit`).join(' • '),
        })
      }
    } catch (err) { console.error('[contest due run]', (err as Error)?.message) }
    let edReminded: string[] = []
    try { edReminded = await sendEditorDeadlineReminders() } catch (err) { console.error('[editor-deadline run]', (err as Error)?.message) }
    if (edReminded.length) {
      await sendProblemAlert({
        kind: 'report', where: 'нагадування редакторам — 3 дні до строку',
        error: `Надіслано ${edReminded.length} нагадувань редакторам`,
        extra: edReminded.join(' • '),
      })
    }
    let reminded: string[] = []
    try { reminded = await sendCoverReminders() } catch (err) { console.error('[cover-reminder run]', (err as Error)?.message) }
    if (reminded.length) {
      await sendProblemAlert({
        kind: 'report', where: 'нагадування авторам про обкладинку',
        error: `Надіслано ${reminded.length} нагадувань. Якщо до строку відповіді не буде — обкладинку робимо самі.`,
        extra: reminded.join(' • '),
      })
    }
    // 21.10.2026: автор тижня — понеділок: нагадування обрати; середа: якщо не обрано — ставимо першого кандидата
    try {
      const dow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' })).getDay()
      if (dow === 1 || dow === 3) {
        const chosen = await featuredThisWeek()
        if (!chosen) {
          const c = await featuredCandidates(5)
          if (dow === 1 && c.length) {
            await sendProblemAlert({ kind: 'todo', where: 'автор тижня — оберіть на цей тиждень', error: `Кандидати: ${c.map((x) => `${x.name} (${x.works} творів)`).join(', ')}`, extra: 'Обрати: https://balabony.com/admin/avtor-tyzhnia — якщо до середи не оберете, сайт поставить першого кандидата сам.' })
          } else if (dow === 3 && c[0]) {
            await setFeatured(c[0].user_id, c[0].slug, c[0].name, 'auto')
            revalidatePath('/')
            await sendProblemAlert({ kind: 'report', where: 'автор тижня — поставлено автоматично', error: `${c[0].name} (${c[0].works} творів)`, extra: 'Змінити: https://balabony.com/admin/avtor-tyzhnia' })
          }
        }
      }
    } catch (err) { console.error('[featured-author run]', (err as Error)?.message) }
    // 20.10.2026: лист «обкладинка через Gemini» — один раз кожному автору з творами без обкладинки
    let howto: string[] = []
    try { howto = await sendCoverHowto() } catch (err) { console.error('[cover-howto run]', (err as Error)?.message) }
    if (howto.length) {
      await sendProblemAlert({
        kind: 'report', where: 'лист авторам — обкладинка через Gemini',
        error: `Надіслано ${howto.length} листів (у дужках — скільки творів без обкладинки)`,
        extra: howto.join(' • '),
      })
    }
    if (lines.length) {
      await sendProblemAlert({
        kind: 'todo', where: 'щоденна перевірка — є незавершені справи',
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
