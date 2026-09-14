import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { CONTESTS } from '@/lib/contests'

/**
 * Зведення намірів узяти участь — для адмінки.
 *
 * НАВІЩО. Стелі учасників немає, а кожна серія проходить редактуру перед
 * виходом. Треба знати порядок цифр до 25 листопада, а не після: двадцять
 * серіалів — це двісті серій за десять тижнів.
 *
 * ЩО РАХУЄМО НА КОЖЕН КОНКУРС
 *   intents   — скільки авторів позначили намір;
 *   submitted — скільки з них уже подали заявку;
 *   pending   — позначили, але не подали (це і є список, кому писати);
 *   episodes  — намір × кількість серій у конкурсі, тобто скільки текстів
 *               доведеться вичитати, якщо подадуться всі.
 *
 * ЦИФРА — ВЕРХНЯ МЕЖА, А НЕ ПРОГНОЗ. Намір нічого не зобов'язує: частина
 * позначить і не подасть, частина подасть не позначивши. Планувати варто
 * приблизно за половиною — так і підписано на сторінці.
 */

export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const pass = process.env.ADMIN_PASSWORD
  return Boolean(pass) && req.cookies.get('admin_session')?.value === pass
}

type Person = { name: string; email: string; submitted: boolean }

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Одна вибірка: намір + чи є заявка того самого автора на той самий конкурс.
    const r = await dbQuery(
      `select i.contest,
              coalesce(nullif(p.display_name, ''), '—')        as name,
              coalesce(p.email, u.email, '')                   as email,
              (e.id is not null)                               as submitted
         from contest_intents i
         left join author_profiles p on p.user_id = i.user_id
         left join auth.users u      on u.id      = i.user_id
         left join contest_entries e on e.author_id = i.user_id
                                    and e.contest   = i.contest
        order by i.contest, name`,
    )

    const rows = r.rows as (Person & { contest: string })[]

    const byContest = CONTESTS.map(c => {
      const people = rows.filter(x => x.contest === c.id)
      const submitted = people.filter(x => x.submitted).length
      return {
        id: c.id,
        name: c.name,
        episodesEach: c.episodes,
        intents: people.length,
        submitted,
        pending: people.length - submitted,
        // Скільки серій доведеться вичитати, якщо подадуться всі, хто позначив.
        episodes: people.length * c.episodes,
        people: people.map(({ name, email, submitted }) => ({ name, email, submitted })),
      }
    })

    return NextResponse.json({
      contests: byContest,
      totalEpisodes: byContest.reduce((s, c) => s + c.episodes, 0),
    })
  } catch (err) {
    console.error('[admin/intents]', (err as Error)?.message)
    return NextResponse.json({ error: 'Не вдалося прочитати наміри' }, { status: 500 })
  }
}
