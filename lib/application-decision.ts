// =============================================================================
// РІШЕННЯ ЩОДО ЗАЯВКИ АВТОРА — прийняти / відхилити (спільне для адмінки й кабінету редактора).
//
// 18.11.2026 (рішення Богдана): редактори вирішують самі. Логіку, що була в
// /api/admin/author-applications, винесено сюди без змін поведінки.
//
// «Прийняти» робить за один рух:
//   1. профіль автора (author_profiles) на ТОМУ Ж акаунті, з якого подано заявку;
//   2. запис згоди (author_consents, канал 'form') з датою подачі;
//   3. пробна історія → чернетка в content;
//   4. лист «кабінет відкрито».
// «Відхилити» — статус і ввічливий лист.
// =============================================================================

import { dbQuery } from '@/lib/db'
import { slugify } from '@/lib/slugify'
import { mailApplicationAccepted, mailApplicationRejected } from '@/lib/author-applications'

export class DecisionError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export type DecisionResult = { status: 'accepted' | 'rejected'; contentId?: string; mailed: boolean }

export async function decideApplication(
  id: string,
  action: 'accept' | 'reject',
  note: string,
  opts: { reconsider: boolean },
): Promise<DecisionResult> {
  const f = await dbQuery(
    `select id::text, user_id::text, email, full_name, pen_name, title, genre, body, status,
            created_at, consent_ip
       from author_applications where id = $1`,
    [id],
  )
  if (!f.rowCount) throw new DecisionError('Заявку не знайдено', 404)
  const a = f.rows[0] as {
    id: string; user_id: string; email: string; full_name: string; pen_name: string | null
    title: string; genre: string | null; body: string; status: string; created_at: string
    consent_ip: string | null
  }
  // 15.10.2026: відхилену заявку можна переглянути й прийняти (рішення Богдана — не втрачати нових авторів).
  // Це лише для адмінки; редактор вирішує тільки нові заявки.
  const reconsidered = opts.reconsider && a.status === 'rejected' && action === 'accept'
  if (a.status !== 'new' && !reconsidered) throw new DecisionError('Цю заявку вже розглянуто', 400)

  if (action === 'reject') {
    await dbQuery(
      `update author_applications set status = 'rejected', admin_note = nullif($2,''), decided_at = now() where id = $1`,
      [id, note],
    )
    const mailed = await mailApplicationRejected({ fullName: a.full_name, email: a.email, title: a.title, note })
    return { status: 'rejected', mailed }
  }

  // 1. Профіль автора. Повторний запуск нічого не псує.
  await dbQuery(
    `insert into author_profiles
       (user_id, display_name, email, full_name, pen_name, is_fop, revenue_share, is_active)
     values ($1, $2, $3, $2, $4, false, 0.4, true)
     on conflict (user_id) do update
        set email     = excluded.email,
            pen_name  = coalesce(author_profiles.pen_name, excluded.pen_name),
            is_active = true`,
    [a.user_id, a.full_name, a.email, a.pen_name],
  )

  // 2. Згода на публікацію — з датою подачі заявки, коли людина поставила позначки.
  await dbQuery(
    `insert into author_consents
       (author_name, user_id, scope, status, channel, happened_at, note)
     values ($1, $2, 'balabony', 'given', 'form', $3, $4)`,
    [a.full_name, a.user_id, a.created_at, `заявка автора #${a.id} з сайту${a.consent_ip ? `, IP ${a.consent_ip}` : ''}`],
  )

  // 3. Пробна історія → чернетка. Вільний slug, як у /api/author/new-work.
  const base = slugify(a.title)
  let slug = base
  for (let i = 0; i < 12; i++) {
    const busy = await dbQuery(`select id from content where slug = $1 limit 1`, [slug])
    if (!busy.rowCount) break
    slug = `${base}-${i + 2}`
  }
  const authorName = a.pen_name || a.full_name
  const ins = await dbQuery(
    `insert into content
       (type, status, audio_status, slug, title, text, author_id, author_name, genre,
        is_free, is_adult, is_premium, images, writer_note)
     values ('story', 'draft', 'pending', $1, $2, $3, $4, $5, $6,
             false, false, false, '[]'::jsonb, $7)
     returning id::text`,
    [slug, a.title, a.body, a.user_id, authorName, a.genre, `пробна історія, заявка автора #${a.id}`],
  )
  const contentId = (ins.rows[0] as { id: string }).id

  await dbQuery(
    `update author_applications
        set status = 'accepted', admin_note = nullif($2,''), content_id = $3, decided_at = now()
      where id = $1`,
    [id, note, contentId],
  )

  const mailed = await mailApplicationAccepted({ fullName: a.full_name, email: a.email, title: a.title, note, reconsidered })
  return { status: 'accepted', contentId, mailed }
}
