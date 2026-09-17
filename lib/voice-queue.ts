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

/**
 * Які твори взагалі беруть участь у голосуванні.
 *
 * Три уточнення, кожне куплене помилкою:
 *   1. СТАТУС. На сайті опублікованим вважається і `approved`, і `published`
 *      (див. lib/home-data.ts). Перша версія брала лише `published` — і 476
 *      творів зникли з вибору разом зі своїми авторами.
 *   2. ТИП. Крім окремих історій є серіали `balabony` і `tysha`. Спершу вони
 *      були відрізані; рішення Богдана 09.09.2026 — додати всіх, бо голосують
 *      читачі, а не автор за себе.
 *   3. ЗГОДА. Автори, які згоду відкликали, не беруть участі взагалі:
 *      озвучувати їх ми не маємо права, тож і голос за них був би обманом
 *      читача.
 *
 *      ВАЖЛИВО, як саме читається згода (виправлено 17.09.2026). Перша
 *      редакція шукала БУДЬ-ЯКИЙ запис зі статусом refused/revoked за весь
 *      час. Але `author_consents` — це журнал подій, а не поточний стан:
 *      автор може відмовитися, а через місяць передумати, і тоді в базі
 *      лежать обидва рядки. Зоряна Грабар — відмова 06.08, згода 10.08,
 *      підтвердження 05.09 з приміткою «скасовує відмову» — випала з черги
 *      повністю, будучи при цьому найчитанішою авторкою платформи
 *      (67 чужих дочитувань). Тепер береться ОСТАННІЙ запис за happened_at,
 *      як це вже робили link-authors, author-accounts і send-author-email.
 *
 *      scope = 'balabony' — теж як у решті коду: згоди бувають і на інші
 *      канали, і змішувати їх не можна.
 *
 *      Відсутність запису означає «можна»: інакше черга спорожніла б на
 *      авторах, яких заводили до появи таблиці. Це свідомий компроміс, а
 *      не недогляд — і саме його треба переглянути першим, коли гроші на
 *      озвучення справді з'являться.
 */
const ELIGIBLE = `
  c.status::text in ('approved', 'published')
  and c.type::text in ('story', 'balabony', 'tysha')
  and c.author_name is not null
  and (c.audio_status is null or c.audio_status::text <> 'ready')
  and coalesce((
    select ac.status::text
      from author_consents ac
     where lower(trim(ac.author_name)) = lower(trim(c.author_name))
       and ac.scope = 'balabony'
     order by ac.happened_at desc nulls last, ac.created_at desc
     limit 1
  ), 'given') not in ('refused', 'revoked')
`

/**
 * Автори платформи — не учасники рейтингів у кабінеті (17.09.2026).
 *
 * Назар Колодій — псевдонім засновника, під ним виходять «Балабони» і «Тиша»:
 * 206 творів проти двадцяти-тридцяти у звичайного автора. У змаганні авторів
 * це виглядає як участь судді у власному конкурсі.
 *
 * Виключення діє ЛИШЕ у двох функціях рейтингів кабінету —
 * getQueueWithTrend() і getAuthorVotes(). У getQueue(), яка живить сторінку
 * /cherga, серіали лишаються: читач голосує за їхнє озвучення, і воно
 * планується.
 */
const NOT_RANKED_SQL = ["Назар Колодій"]
  .map(n => `'${n.replace(/'/g, "''")}'`)
  .join(', ')

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
        where ${ELIGIBLE}
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

export interface QueueTrendRow extends QueueRow {
  /** Голоси за останні 7 днів — «рух» позиції за тиждень. */
  recent: number
}

/**
 * Черга з приростом за тиждень — для кабінету автора.
 *
 * getQueue() показує статичну картину: скільки голосів усього. Автор із неї
 * не бачить, чи його твір рухається, чи стоїть — а рухається він рівно тоді,
 * коли автор поділився посиланням. Без цієї колонки кнопка «Текст для
 * соцмереж» лишається дією без наслідку, який видно.
 *
 * Рух рахуємо з voice_votes.created_at, а не зі знімків позицій: колонка
 * вже є, і історія в ній повна з першого голосу. Знімки довелося б
 * накопичувати, і рух з'явився б лише за тиждень після запуску.
 */
export async function getQueueWithTrend(limit = 20): Promise<QueueTrendRow[]> {
  try {
    const r = await dbQuery(
      `select c.id::text, c.title, c.slug, c.type,
              c.author_name,
              count(v.user_id)::int as votes,
              count(v.user_id) filter (
                where v.created_at >= now() - interval '7 days'
              )::int as recent
         from voice_votes v
         join content c on c.id = v.content_id
        where ${ELIGIBLE}
          and coalesce(c.author_name, '') not in (${NOT_RANKED_SQL})
        group by c.id, c.title, c.slug, c.type, c.author_name
        order by votes desc, c.title
        limit $1`,
      [limit],
    )
    return r.rows as QueueTrendRow[]
  } catch {
    return []
  }
}

export interface NarrationRow {
  id: string
  title: string
  slug: string | null
  type: string
  author_name: string | null
  votes: number
  reads: number
}

/**
 * ПОРЯДОК ОЗВУЧЕННЯ — єдина дошка замість трьох здогадок (17.09.2026).
 *
 * ПРАВИЛО, ухвалене Богданом: спершу голоси, при рівності — дочитування.
 * Голос лишається головним: читач витратив за нього 50 балів, і відібрати
 * в нього вирішальне слово заднім числом не можна. Але поки голос на
 * платформі один, рівність — це стан майже всієї черги, тож фактичний
 * порядок сьогодні задають дочитування. Обидві цифри показуємо поруч, щоб
 * автор бачив, що саме підняло твір угору.
 *
 * ЧОМУ НЕ getQueue(). Та функція починає з voice_votes і показує ЛИШЕ те,
 * за що вже голосували, — сьогодні це один рядок. Тут навпаки: беремо всі
 * твори, які взагалі допущені до озвучення, і голоси підставляємо збоку.
 * Автор має бачити свій твір у списку ДО першого голосу, інакше дошка
 * нічого йому не каже.
 *
 * ВЛАСНІ ДОЧИТУВАННЯ АВТОРА не рахуються — те саме правило, що в конкурсі
 * (lib/contest-reads.ts). Інакше порядок озвучення можна було б підняти,
 * відкриваючи власний текст щодня.
 *
 * Псевдонім засновника виключено, як і в решті дощок кабінету: 206 творів
 * «Балабонів» і «Тиші» зайняли б усі двадцять п'ять рядків.
 */
export async function getNarrationOrder(limit = 25): Promise<NarrationRow[]> {
  try {
    const r = await dbQuery(
      `select c.id::text, c.title, c.slug, c.type, c.author_name,
              (select count(*) from voice_votes v
                where v.content_id = c.id)::int as votes,
              (select count(*) from article_reads r
                where r.content_id = c.id
                  and r.completed = true
                  and (c.author_id is null or r.user_id <> c.author_id))::int as reads
         from content c
        where ${ELIGIBLE}
          and coalesce(c.author_name, '') not in (${NOT_RANKED_SQL})
        order by votes desc, reads desc, c.title
        limit $1`,
      [limit],
    )
    return r.rows as NarrationRow[]
  } catch {
    return []
  }
}

export interface AuthorVoteRow {
  author_name: string
  votes: number
  recent: number
  works: number
}

/**
 * РЕЙТИНГ АВТОРІВ ЗА ГОЛОСАМИ — для кабінету.
 *
 * getQueueWithTrend() показує черга ТВОРІВ, і в неї потрапляє лише те, за що
 * вже проголосували. Автор, за якого не голосував ніхто, у тій таблиці не
 * бачив ні себе, ні свого місця — тобто не бачив, наскільки він відстав і
 * від кого. Змагання без видимої таблиці не змагання.
 *
 * Тут навпаки: беремо ВСІХ авторів, у яких є що озвучувати, і лівим
 * приєднанням додаємо голоси. Нулі лишаються в списку — саме вони й
 * показують авторові, де він стоїть.
 *
 * Порядок: більше голосів вище, за рівних — більше творів, далі за абеткою.
 * Без останніх двох правил сотня авторів із нулем шикувалася б випадково і
 * місця стрибали б при кожному оновленні сторінки.
 */
export async function getAuthorVotes(limit = 100): Promise<AuthorVoteRow[]> {
  try {
    const r = await dbQuery(
      `with eligible as (
         select c.id, c.author_name
           from content c
          where ${ELIGIBLE}
       )
       select e.author_name,
              count(distinct e.id)::int                        as works,
              count(v.user_id)::int                            as votes,
              count(v.user_id) filter (
                where v.created_at >= now() - interval '7 days'
              )::int                                           as recent
         from eligible e
         left join voice_votes v on v.content_id = e.id
        where coalesce(e.author_name, '') not in (${NOT_RANKED_SQL})
        group by e.author_name
        order by votes desc, works desc, e.author_name
        limit $1`,
      [limit],
    )
    return r.rows as AuthorVoteRow[]
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
        where ${ELIGIBLE}
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
        where ${ELIGIBLE}
          and c.author_name = $1
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
    /**
     * ЗА ВЛАСНИЙ ТВІР ГОЛОСУВАТИ НЕ МОЖНА (17.09.2026).
     *
     * Досі перевірки не було, і разом із міткою `?ref=` у шаблоні допису це
     * склалося в готовий шлях накрутки: автор приводить знайомого, дістає
     * за нього 50 балів — рівно ціну голосу — і ставить його собі. Десять
     * приведених родичів = десять голосів, і «Порядок озвучення» показує
     * не вибір читачів, а вміння автора агітувати сім'ю.
     *
     * Бали за приведеного читача лишаються: він справді прийшов. Не можна
     * тільки замкнути їх на себе. Другий акаунт це обійде — від нього тут
     * захисту немає й не буде, як і в підрахунку конкурсу.
     */
    const own = await dbQuery(
      `select 1 from content where id = $1 and author_id = $2 limit 1`,
      [contentId, userId],
    )
    if (own.rowCount && own.rowCount > 0) {
      return { ok: false, error: 'За власний твір голосувати не можна.' }
    }

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

export interface VoteState {
  /** Чи бере цей твір участь у голосуванні взагалі. */
  eligible: boolean
  /** Скільки голосів уже має твір. */
  votes: number
  /** Чи голосував за нього саме цей читач. */
  voted: boolean
}

/**
 * Стан голосування для ОДНОГО твору — для кнопки на сторінці твору.
 *
 * Окремо від getQueue навмисно: та тягне двадцять рядків черги і список усіх
 * авторів, а сторінці твору потрібні три числа. Ставити важкий запит на кожне
 * відкриття тексту не можна — це найчастіша сторінка на сайті.
 */
export async function getVoteState(userId: string | null, contentId: string): Promise<VoteState> {
  try {
    const r = await dbQuery(
      `select
         exists (select 1 from content c where c.id = $1 and ${ELIGIBLE}) as eligible,
         (select count(*)::int from voice_votes where content_id = $1) as votes,
         ($2::uuid is not null and exists (
            select 1 from voice_votes where content_id = $1 and user_id = $2::uuid
         )) as voted`,
      [contentId, userId],
    )
    const row = r.rows[0] as { eligible: boolean; votes: number; voted: boolean } | undefined
    return {
      eligible: Boolean(row?.eligible),
      votes: Number(row?.votes ?? 0),
      voted: Boolean(row?.voted),
    }
  } catch {
    // Кнопка — не головне на сторінці твору: якщо запит упав, ховаємо її,
    // а не ламаємо читання.
    return { eligible: false, votes: 0, voted: false }
  }
}
