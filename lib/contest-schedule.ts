// =============================================================================
// АВТОМАТИЧНИЙ РОЗКЛАД КОНКУРСНИХ СЕРІЙ (рішення Богдана 14.10.2026).
//
// Прийнята робота сама отримує дати виходу за календарем конкурсу:
//   «П'ять вечорів»     — 6, 10, 13, 17, 20 листопада 2026, 18:00 за Києвом,
//                          однаково для всіх робіт (серія N → N-та дата);
//   «Це довга історія»  — кожен автор у свій день тижня: робота № 1 стартує
//                          25.11, № 2 — 26.11 … № 7 — 01.12, № 8 знову 25.11;
//                          далі серії щотижня, 18:00 за Києвом.
// Серія отримує status = 'scheduled' і publish_at — далі її публікує щогодинний
// cron publish-scheduled. За ДВА ДНІ до виходу Богдан отримує лист-нагадування
// (cron pending-check), щоб ще раз переглянути текст.
// Відхилена робота знімається з розкладу (unscheduleEntry).
// Конкурси з однією серією — за умовами конкурсу (07.11.2026, Богдан: «умови не порушуємо»):
//   казки «Одного разу перед Різдвом» — по одній на день 25.11–19.12.2026, 18:00;
//   «Один день, який усе змінив» і «З вітерцем» — по одній на день 12–29.01.2027, 18:00.
//   Черга — у порядку прийняття: кожна нова робота бере наступний вільний день.
// =============================================================================

import { dbQuery } from '@/lib/db'

// У листопаді–лютому Київ живе за UTC+2, тож 18:00 за Києвом = 16:00 UTC.
const AT = 'T16:00:00Z'

// 05.11.2026 (Богдан): старт перенесено на 6 листопада — 6, 10, 13, 17, 20.11, 18:00.
const FIVE_EVENINGS = ['2026-11-06', '2026-11-10', '2026-11-13', '2026-11-17', '2026-11-20']
const SERIAL_START = '2026-11-25'
// Черги для конкурсів з однією серією: [перший день, кількість днів].
const QUEUES: Record<string, [string, number]> = {
  'odnoho-razu-pered-rizdvom': ['2026-11-25', 25],
  'odyn-den': ['2027-01-12', 18],
  'z-viterczem': ['2027-01-12', 18],
}

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
  // Черга конкурсу з однією серією: скільки інших робіт уже мають дату — така й наша позиція.
  let queued: string | null = null
  const q = QUEUES[entry.contest]
  if (q) {
    const taken = await dbQuery(
      `select count(distinct ep.entry_id)::int as n
         from contest_episodes ep join contest_entries e on e.id = ep.entry_id join content c on c.id = ep.content_id
        where e.contest = $1 and ep.entry_id::text <> $2 and c.publish_at is not null and c.status in ('scheduled', 'published')`,
      [entry.contest, entryId],
    )
    const slot = ((taken.rows[0] as { n: number } | undefined)?.n ?? 0) % q[1]
    queued = addDays(q[0], slot) + AT
  }
  let n = 0
  for (const ep of eps.rows as { ord: number; content_id: string }[]) {
    const when = episodeDate(entry.contest, entry.entry_number, ep.ord) ?? queued
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
        and e.contest in ('pyat-vechoriv', 'ce-dovha-istoriya', 'odnoho-razu-pered-rizdvom', 'odyn-den', 'z-viterczem')
      order by e.id::text`,
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
