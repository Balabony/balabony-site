// 14.10.2026 (Богдан: «усі твори, що надійшли, — прийняті; відхиляє редактор після читання»).
// Приймання = створити чернетки серій у content. Тепер відбувається САМЕ:
// при подачі (api/contest/submit) і при відкритті адмінки «Конкурси» — для старих заявок.
// Безпечно викликати повторно: серії з уже заповненим content_id пропускаються.
import { dbQuery } from '@/lib/db'
import { slugify } from '@/lib/slugify'
import { findContest } from '@/lib/contests'
import { scheduleEntry } from '@/lib/contest-schedule'

// 17.10.2026: заявку можна подати ще до того, як автор заповнив ім'я в профілі —
// тоді author_name порожній і в заявці, і в серіях (так було з Калиновською й Селезньовою).
// Підтягуємо ім'я з author_profiles і в заявки, і в уже створені твори.
export async function fillAuthorNames(): Promise<void> {
  await dbQuery(
    `update contest_entries e set author_name = p.display_name
       from author_profiles p
      where p.user_id = e.author_id
        and coalesce(e.author_name, '') = ''
        and coalesce(p.display_name, '') <> ''`,
  )
  await dbQuery(
    `update content c set author_name = p.display_name
       from author_profiles p
      where p.user_id = c.author_id
        and coalesce(c.author_name, '') = ''
        and coalesce(p.display_name, '') <> ''`,
  )
}

export async function acceptEntry(entryId: string): Promise<number> {
  try { await fillAuthorNames() } catch (e) { console.error('[contest-accept] names', (e as Error)?.message) }
  const found = await dbQuery(
    `select id::text, author_id::text, author_name, contest, title, annotation, genre, cover_url, status
       from contest_entries where id::text = $1`,
    [entryId],
  )
  const entry = found.rows[0] as {
    id: string; author_id: string; author_name: string
    contest: string; title: string; annotation: string; genre: string
    cover_url: string | null; status: string
  } | undefined
  if (!entry || entry.status === 'rejected') return 0

  // ── Приймання: серії → чернетки в content ────────────────────────────
  const contest = findContest(entry.contest)
  const eps = await dbQuery(
    `select id::text, ord, body, words from contest_episodes
      where entry_id = $1 and content_id is null
      order by ord`,
    [entryId],
  )

  // 14.10.2026: серіал визначаємо за умовами конкурсу, а не за кількістю серій у цій подачі —
  // автор досилає серії по одній, і перша не повинна стати окремим «твором без серії».
  const multi = (contest?.episodes ?? 1) > 1
  let created = 0

  for (const raw of eps.rows as { id: string; ord: number; body: string }[]) {
    // Назва серії: для одного твору — його назва, для серіалу з номером.
    // 22.10.2026: «Що ти бачиш?. Серія 1» — після ?, !, … чи крапки другу крапку не ставимо
    const title = multi ? `${entry.title.trim()}${/[.!?…]$/.test(entry.title.trim()) ? '' : '.'} Серія ${raw.ord}` : entry.title

    // Вільний slug. Той самий підхід, що в /api/author/new-work.
    const base = slugify(title)
    let slug = base
    for (let i = 0; i < 12; i++) {
      const busy = await dbQuery(`select id from content where slug = $1 limit 1`, [slug])
      if (!busy.rowCount) break
      slug = `${base}-${i + 2}`
    }

    const ins = await dbQuery(
      `insert into content
         (type, status, audio_status, slug, title, text, author_id, author_name,
          genre, description, season_number, episode_number,
          is_free, is_adult, is_premium, images, writer_note, cover_url)
       values ('story', 'draft', 'pending', $1, $2, $3, $4, $5,
               $6, $7, $8, $9,
               true, false, false, '[]'::jsonb, $10, $11)
       returning id::text`,
      [
        slug, title, raw.body, entry.author_id, entry.author_name,
        entry.genre || null,
        raw.ord === 1 ? (entry.annotation || null) : null,
        multi ? 1 : null,
        multi ? raw.ord : null,
        `конкурс: ${contest?.name ?? entry.contest}`,
        entry.cover_url || null, // 14.10.2026: обкладинка, завантажена до приймання
      ],
    )

    const contentId = (ins.rows[0] as { id: string }).id
    await dbQuery(
      `update contest_episodes set content_id = $2 where id = $1`,
      [raw.id, contentId],
    )
    created += 1
  }

  await dbQuery(
    `update contest_entries set status = 'accepted', updated_at = now() where id = $1`,
    [entryId],
  )


  // 14.10.2026: дати виходу — одразу за календарем конкурсу.
  try { await scheduleEntry(entryId) } catch (e) { console.error('[contest-accept] schedule', (e as Error)?.message) }
  return created
}

/** Приймає всі заявки зі статусом «нова» і досилає в каталог нові серії прийнятих. */
export async function acceptPending(): Promise<void> {
  try { await fillAuthorNames() } catch (e) { console.error('[contest-accept] names', (e as Error)?.message) }
  const r = await dbQuery(
    `select distinct e.id::text from contest_entries e
       left join contest_episodes ep on ep.entry_id = e.id
      where e.status = 'new' or (e.status = 'accepted' and ep.id is not null and ep.content_id is null)`,
  )
  for (const row of r.rows as { id: string }[]) {
    try { await acceptEntry(row.id) } catch (e) { console.error('[contest-accept]', row.id, (e as Error)?.message) }
  }
}
