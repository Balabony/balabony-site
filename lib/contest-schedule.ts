// =============================================================================
// АВТОМАТИЧНИЙ РОЗКЛАД КОНКУРСНИХ СЕРІЙ (рішення Богдана 14.10.2026).
//
// Прийнята робота сама отримує дати виходу за календарем конкурсу:
//   «П'ять вечорів»     — 3, 6, 10, 13, 17 листопада 2026, 18:00 за Києвом,
//                          однаково для всіх робіт (серія N → N-та дата);
//   «Це довга історія»  — кожен автор у свій день тижня: робота № 1 стартує
//                          25.11, № 2 — 26.11 … № 7 — 01.12, № 8 знову 25.11;
//                          далі серії щотижня, 18:00 за Києвом.
// Серія отримує status = 'scheduled' і publish_at — далі її публікує щогодинний
// cron publish-scheduled. За ДВА ДНІ до виходу Богдан отримує лист-нагадування
// (cron pending-check), щоб ще раз переглянути текст.
// Відхилена робота знімається з розкладу (unscheduleEntry).
// Конкурси з однією серією (казки, «Один день», «З вітерцем») тут не плануються.
// =============================================================================

import { dbQuery } from '@/lib/db'

// У листопаді–лютому Київ живе за UTC+2, тож 18:00 за Києвом = 16:00 UTC.
const AT = 'T16:00:00Z'

const FIVE_EVENINGS = ['2026-11-03', '2026-11-06', '2026-11-10', '2026-11-13', '2026-11-17']
const SERIAL_START = '2026-11-25'

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Дата виходу серії або null, якщо конкурс не плануємо автоматично. */
export function episodeDate(contest: string, entryNumber: number | null, ord: number): string | null {
  if (contest === 'pyat-vechoriv') return FIVE_EVENINGS[ord - 1] ? FIVE_EVENINGS[ord - 1] + AT : null
  if (contest === 'ce-dovha-istoriya') {
    const shift = ((entryNumber ?? 1) - 1) % 7
    return addDays(SERIAL_START, shift + 7 * (ord - 1)) + AT
  }
  return null
}

/** Ставить дати чернеткам серій прийнятої роботи. Уже опубліковані не чіпає. Повертає кількість. */
export async function scheduleEntry(entryId: string): Promise<number> {
  const e = await dbQuery(
    `select contest, entry_number, status from contest_entries where id::text = $1`,
    [entryId],
  )
  const entry = e.rows[0] as { contest: string; entry_number: number | null; status: string } | undefined
  if (!entry || entry.status !== 'accepted') return 0
  const eps = await dbQuery(
    `select ep.ord, ep.content_id::text as content_id
       from contest_episodes ep join content c on c.id = ep.content_id
      where ep.entry_id::text = $1 and c.status in ('draft', 'scheduled')`,
    [entryId],
  )
  let n = 0
  for (const ep of eps.rows as { ord: number; content_id: string }[]) {
    const when = episodeDate(entry.contest, entry.entry_number, ep.ord)
    if (!when) continue
    await dbQuery(
      `update content set status = 'scheduled', publish_at = $2, updated_at = now()
        where id::text = $1 and status in ('draft', 'scheduled')`,
      [ep.content_id, when],
    )
    n += 1
  }
  return n
}

/** Знімає з розкладу серії відхиленої роботи (назад у чернетки). */
export async function unscheduleEntry(entryId: string): Promise<void> {
  await dbQuery(
    `update content set status = 'draft', publish_at = null, updated_at = now()
      where status = 'scheduled'
        and id in (select content_id from contest_episodes where entry_id::text = $1 and content_id is not null)`,
    [entryId],
  )
}

/** Для всіх прийнятих робіт, у яких є незаплановані чернетки серій. */
export async function schedulePending(): Promise<void> {
  const r = await dbQuery(
    `select distinct e.id::text from contest_entries e
       join contest_episodes ep on ep.entry_id = e.id
       join content c on c.id = ep.content_id
      where e.status = 'accepted' and c.status = 'draft'
        and e.contest in ('pyat-vechoriv', 'ce-dovha-istoriya')`,
  )
  for (const row of r.rows as { id: string }[]) {
    try { await scheduleEntry(row.id) } catch (err) { console.error('[contest-schedule]', row.id, (err as Error)?.message) }
  }
}

/** Конкурсні серії, що виходять ПІСЛЯЗАВТРА (за Києвом) — для нагадування Богдану. */
export async function dueInTwoDays(): Promise<{ id: string; title: string; author: string | null; publish_at: string }[]> {
  const r = await dbQuery(
    `select c.id::text, c.title, c.author_name as author, c.publish_at
       from content c
       join contest_episodes ep on ep.content_id = c.id
      where c.status = 'scheduled'
        and (c.publish_at at time zone 'Europe/Kyiv')::date = (now() at time zone 'Europe/Kyiv')::date + 2
      order by c.publish_at, c.title`,
  )
  return r.rows as { id: string; title: string; author: string | null; publish_at: string }[]
}
