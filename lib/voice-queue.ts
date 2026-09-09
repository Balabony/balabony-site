import { dbQuery } from '@/lib/db'
import { getBalance, awardPoints } from '@/lib/points'

/**
 * Черга на озвучення: читач витрачає бали, щоб просунути твір уперед.
 *
 * Чому саме це, а не обмін балів на платний доступ. Обмін балів на контент —
 * найпоширеніша механіка у світі (Qidian, KakaoPage), але вона віддає те, що
 * ми ще навіть не почали продавати: передплати немає, запуск 25.11.
 *
 * Натомість у нас є дефіцит, якого не купиш за жодні бали: озвучення. Коштів
 * на нього зараз немає, і ми чесно сказали про це авторам. Голосування дає
 * читачеві реальний вплив, нам не коштує нічого, а коли гроші з'являться —
 * ми вже знатимемо, з чого починати.
 *
 * Списання йде від'ємним рядком у `point_events`, тому окремої таблиці
 * балансу не треба: баланс і далі є сумою всіх подій. `ref` = id твору, тож
 * повторне списання за той самий твір неможливе навіть при подвійному
 * натисканні.
 */

/** Скільки коштує голос. Стільки ж дає приведений друг або п'ять прочитаних серій. */
export const VOTE_COST = 50

export interface QueueRow {
  id: string
  title: string
  slug: string | null
  type: string
  author_name: string | null
  votes: number
}

/** Твори з найбільшою кількістю голосів. Уже озвучені не показуємо. */
export async function getQueue(limit = 20): Promise<QueueRow[]> {
  try {
    const r = await dbQuery(
      `select c.id::text, c.title, c.slug, c.type,
              c.author_name,
              count(v.user_id)::int as votes
         from voice_votes v
         join content c on c.id = v.content_id
        where c.status = 'published'
          -- audio_status це ENUM: порожній рядок у coalesce валить запит
          -- помилкою 22P02, тому порівнюємо через ::text і окремо ловимо null.
          and (c.audio_status is null or c.audio_status::text <> 'ready')
        group by c.id, c.title, c.slug, c.type, c.author_name
        order by votes desc, c.title
        limit $1`,
      [limit],
    )
    return r.rows as QueueRow[]
  } catch {
    return []
  }
}

/**
 * З чого можна вибирати, поки черга порожня.
 *
 * Без цього блоку сторінка на старті була б порожньою і проголосувати не було
 * б за що: голоси беруться лише з творів, за які вже хтось віддав голос.
 * Беремо свіжі опубліковані твори без аудіо. Коли на сторінці твору з'явиться
 * своя кнопка голосування, цей блок можна буде прибрати.
 */
export async function getCandidates(limit = 24): Promise<QueueRow[]> {
  try {
    const r = await dbQuery(
      `select c.id::text, c.title, c.slug, c.type, c.author_name,
              (select count(*) from voice_votes v where v.content_id = c.id)::int as votes
         from content c
        where c.status = 'published'
          and c.type = 'story'
          -- audio_status це ENUM: порожній рядок у coalesce валить запит
          -- помилкою 22P02, тому порівнюємо через ::text і окремо ловимо null.
          and (c.audio_status is null or c.audio_status::text <> 'ready')
        order by c.created_at desc
        limit $1`,
      [limit],
    )
    return r.rows as QueueRow[]
  } catch {
    return []
  }
}

export interface AuthorRow {
  author_name: string
  works: number
}

/**
 * Усі автори, у яких є що озвучувати.
 *
 * Перша версія показувала 24 найсвіжіші твори — і сторінку займали три твори
 * поспіль від одного автора, бо він заливався останнім. Читач бачив не вибір,
 * а чиюсь добірку, а проголосувати за твір, опублікований раніше, не міг
 * узагалі. Тому вибір іде від автора: спершу ім'я, потім його твори.
 */
export async function getAuthors(): Promise<AuthorRow[]> {
  try {
    const r = await dbQuery(
      `select c.author_name, count(*)::int as works
         from content c
        where c.status = 'published'
          and c.type = 'story'
          and c.author_name is not null
          and (c.audio_status is null or c.audio_status::text <> 'ready')
        group by c.author_name
        order by c.author_name`,
    )
    return r.rows as AuthorRow[]
  } catch {
    return []
  }
}

/** Твори одного автора — з поточною кількістю голосів. */
export async function getWorksByAuthor(authorName: string): Promise<QueueRow[]> {
  try {
    const r = await dbQuery(
      `select c.id::text, c.title, c.slug, c.type, c.author_name,
              (select count(*) from voice_votes v where v.content_id = c.id)::int as votes
         from content c
        where c.status = 'published'
          and c.type = 'story'
          and c.author_name = $1
          and (c.audio_status is null or c.audio_status::text <> 'ready')
        order by c.title`,
      [authorName],
    )
    return r.rows as QueueRow[]
  } catch {
    return []
  }
}

/** За що вже проголосував цей читач. */
export async function getMyVotes(userId: string): Promise<string[]> {
  try {
    const r = await dbQuery(
      `select content_id::text from voice_votes where user_id = $1`,
      [userId],
    )
    return (r.rows as { content_id: string }[]).map(x => x.content_id)
  } catch {
    return []
  }
}

export type VoteResult =
  | { ok: true; votes: number; balance: number }
  | { ok: false; error: string }

/**
 * Віддати голос. Спершу списуємо бали, потім ставимо голос: якщо голос не
 * пройде через дублікат, повертаємо списане назад окремим додатним рядком.
 * Навпаки робити не можна — інакше при збої зі списанням голос лишався б
 * безкоштовним.
 */
export async function castVote(userId: string, contentId: string): Promise<VoteResult> {
  const balance = await getBalance(userId)
  if (balance < VOTE_COST) {
    return { ok: false, error: `Потрібно ${VOTE_COST} балів, у вас ${balance}.` }
  }

  try {
    const exists = await dbQuery(
      `select 1 from voice_votes where user_id = $1 and content_id = $2 limit 1`,
      [userId, contentId],
    )
    if (exists.rowCount && exists.rowCount > 0) {
      return { ok: false, error: 'Ви вже голосували за цей твір.' }
    }

    await awardPoints(userId, 'voice_vote', `vote:${contentId}`, -VOTE_COST)

    const ins = await dbQuery(
      `insert into voice_votes (user_id, content_id)
       values ($1, $2)
       on conflict do nothing
       returning 1`,
      [userId, contentId],
    )

    if (!ins.rowCount) {
      // Голос не став — повертаємо бали, щоб людина не втратила їх ні за що.
      await awardPoints(userId, 'voice_vote', `refund:${contentId}`, VOTE_COST)
      return { ok: false, error: 'Ви вже голосували за цей твір.' }
    }

    const cnt = await dbQuery(
      `select count(*)::int as n from voice_votes where content_id = $1`,
      [contentId],
    )
    return {
      ok: true,
      votes: (cnt.rows[0] as { n: number } | undefined)?.n ?? 1,
      balance: balance - VOTE_COST,
    }
  } catch {
    return { ok: false, error: 'Не вдалося зарахувати голос. Спробуйте ще раз.' }
  }
}
