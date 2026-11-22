import { dbQuery } from '@/lib/db'
import { CONTESTS } from '@/lib/contests'

// 05.11.2026 (Богдан): дочитування зараховуються лише в офіційні дати конкурсу
// (stages.publishFrom … stages.reviewUntil, за Києвом). Раніше рахувалися з моменту
// публікації — твір, що вийшов у жовтні, мав фору перед тим, що вийде в січні.
// 07.11.2026: для конкурсів з однією серією в опублікованих умовах — окреме вікно для КОЖНОГО твору:
// казки — 21 день від виходу казки, «Один день» і «З вітерцем» — 30 днів від виходу твору.
const PER_WORK_DAYS: Record<string, number> = { 'odnoho-razu-pered-rizdvom': 21, 'odyn-den': 30, 'z-viterczem': 30 }
const WINDOWS = CONTESTS.map((c) =>
  `('${c.id}', ${c.stages?.publishFrom ? `date '${c.stages.publishFrom}'` : 'null::date'}, ${c.stages?.reviewUntil ? `date '${c.stages.reviewUntil}'` : 'null::date'}, ${PER_WORK_DAYS[c.id] ?? 'null::int'})`,
).join(',\n         ')

/**
 * Підрахунок зарахованих дочитувань по конкурсних роботах.
 *
 * Це те число, з якого складається половина підсумкової оцінки, і те
 * саме, що публікується на сторінці конкурсу. Одна функція на всіх — щоб
 * адмінка, кабінет автора й відкрита сторінка ніколи не показували різні
 * цифри за одну роботу.
 *
 * ЗВІДКИ ДАНІ
 *   article_reads   — прочитання: user_id, content_id, read_date, completed.
 *                     Це та сама таблиця, за якою рахується винагорода
 *                     авторам за договором, п. 1.5. Конкурс навмисно
 *                     рахує рівно те саме, що й гроші.
 *   content         — хто автор твору (author_id) і чи він уже вийшов.
 *   contest_episodes.content_id — який твір до якої заявки належить.
 *
 * ЧОТИРИ УМОВИ, УСІ З ОПУБЛІКОВАНИХ ПРАВИЛ
 *
 *   0. Читач має бути в акаунті.
 *      resolveReaderId() пише в article_reads або id акаунта, або
 *      ідентифікатор із cookie для гостя. Гості відсіюються join-ом
 *      із users: без цього та сама людина з трьох браузерів давала б
 *      три дочитування.
 *
 *   1. Перегляди з акаунта автора не зараховуються.
 *      ar.user_id <> author_id твору.
 *
 *   2. Кожен читач за кожну серію один раз за весь конкурс.
 *      article_reads тримає рядок на (user, content, ДАТА) — тобто
 *      постійний читач дає рядок щодня. Тому рахуємо не рядки, а
 *      різні пари «читач + серія». Стара редакція правил дозволяла
 *      «раз на добу», і це була діра: знайомий, який заходить щодня,
 *      накручував безмежно.
 *
 *   3. Зараховується читач, який прочитав щонайменше один твір ІНШОГО
 *      автора. «Іншого» — відносно автора тієї роботи, яку рахуємо.
 *      Умова діє заднім числом: щойно читач відкриє для себе ще когось,
 *      усі його попередні дочитування стають чинними. Саме тому це
 *      EXISTS без обмеження за датою — інакше «заднім числом» не працює.
 *
 * ЧОГО ТУТ НЕМАЄ І НЕ БУДЕ
 *   Час на сторінці, швидкість гортання, кілька акаунтів з одного
 *   пристрою, IP-адреси, поведінковий аналіз. Усе це свідомо відкинуто
 *   11.09.2026: сигнали слабкі, а хибне спрацювання б’є по чесному
 *   читачеві. Санкції за накрутку теж немає — дочитування просто не
 *   зараховується.
 */

export type ContestCount = {
  /** id заявки в contest_entries. */
  entryId: string
  /** Скільки дочитувань зараховано. */
  counted: number
}

/** Рядок відкритої таблиці на сторінці конкурсу. */
export type PublicContestRow = {
  entryId: string
  contest: string
  title: string
  author: string
  /** Скільки серій цієї роботи вже вийшло на сайті. */
  episodes: number
  counted: number
}

/**
 * Спільна частина обох запитів: серії заявок і зараховані дочитування.
 * Винесено в одну константу навмисно — правила підрахунку не мають
 * існувати у двох редакціях, інакше адмінка й відкрита сторінка з часом
 * розійдуться в цифрах, і довести, яка з них правильна, буде нічим.
 */
const BASE_CTE = `
  with win(contest, f, u, days) as (
    values ${WINDOWS}
  ),
  works as (
    select ep.id        as episode_id,
           ep.entry_id  as entry_id,
           ep.content_id,
           c.author_id,
           c.status     as content_status,
           w0.f         as win_from,
           w0.u         as win_until,
           w0.days      as win_days,
           (coalesce(c.published_at, c.publish_at) at time zone 'Europe/Kyiv')::date as pub_day
      from contest_episodes ep
      join content c on c.id = ep.content_id
      join contest_entries e0 on e0.id = ep.entry_id
      left join win w0 on w0.contest = e0.contest
     where ep.content_id is not null
  ),
  -- 16.11.2026: зараховані пари «читач + серія» винесено в окремий CTE, щоб перевірка
  -- накрутки (farmingCheck нижче) брала рівно ті самі правила, а не свою копію.
  pairs as (
    select w.entry_id, w.episode_id, w.author_id, ar.user_id, ar.read_date
      from works w
      join article_reads ar
        on ar.content_id = w.content_id
       and ar.completed = true
      join users u
        on u.id = ar.user_id
     where (w.author_id is null or ar.user_id <> w.author_id)
       and (
             -- звичайне вікно конкурсу
             ((w.win_from is null or ar.read_date >= w.win_from)
              and (w.win_until is null or ar.read_date <= w.win_until)
              and (w.win_days is null or (w.pub_day is not null and ar.read_date >= w.pub_day and ar.read_date < w.pub_day + w.win_days)))
             -- 09.11.2026 (Богдан, звернення Зоряни Л.): 05–07.11 конкурсні твори з однією серією виходили одразу після погодження,
             -- а 07.11 їх повернули в чергу (status 'scheduled') з пізнішою датою. Дочитування до офіційної дати виходу можливі лише
             -- через цю нашу помилку (чернетку бачить тільки автор, а його власні прочитання не рахуються) — тому зараховуємо їх авторові.
             -- Лише конкурси з окремим вікном на кожен твір і лише дні помилки (05–07.11), щоб не зарахувати перегляди редакторів у інші дні.
             or (w.win_days is not null and w.pub_day is not null and ar.read_date < w.pub_day and ar.read_date between date '2026-11-05' and date '2026-11-07')
           )
       and exists (
             select 1
               from article_reads ar2
               join content c2 on c2.id = ar2.content_id
              where ar2.user_id = ar.user_id
                and ar2.completed = true
                and c2.author_id is not null
                and (w.author_id is null or c2.author_id <> w.author_id)
           )
  ),
  counted as (
    select entry_id,
           count(distinct user_id::text || ':' || episode_id::text)::int as counted
      from pairs
     group by entry_id
  )
`

const SQL = `
  ${BASE_CTE}
  select entry_id::text as entry_id, counted
    from counted
`

/**
 * Те саме для відкритої сторінки, з двома додатковими умовами.
 *
 * ЧОМУ ФІЛЬТР ПО content.status, А НЕ ПО content_id.
 * Приймання заявки в адмінці створює рядки в `content` одразу — зі
 * статусом `draft`, і `contest_episodes.content_id` заповнюється в ту
 * саму мить. Тобто заповнений content_id означає «прийнято», а не
 * «вийшло на сайті». Якби відкрита таблиця будувалася по ньому, назви
 * всіх прийнятих робіт з'явилися б на сторінці ще під час прийому — з
 * нулями навпроти. Публікацію робить cron, він ставить `published`;
 * саме цей статус тут і перевіряємо.
 */
const PUBLIC_SQL = `
  ${BASE_CTE},
  live as (
    select entry_id, count(*)::int as episodes
      from works
     where content_status = 'published'
     group by entry_id
  )
  select e.id::text                    as entry_id,
         e.contest                     as contest,
         e.title                       as title,
         coalesce(e.author_name, '')   as author,
         l.episodes                    as episodes,
         coalesce(c.counted, 0)::int   as counted
    from contest_entries e
    join live l      on l.entry_id = e.id
    left join counted c on c.entry_id = e.id
   where e.status = 'accepted'
   order by coalesce(c.counted, 0) desc, e.title
`

/**
 * Зараховані дочитування по всіх заявках.
 * Заявки без жодного зарахованого дочитування у відповідь не потрапляють —
 * той, хто викликає, підставляє нуль сам.
 */
export async function countedReadsByEntry(): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  try {
    const res = await dbQuery(SQL)
    // 22.11.2026: SQL віддає колонку entry_id (snake_case), а тут читали entryId — ключ завжди
    // виходив "undefined", і адмінка показувала 0 зарахованих дочитувань у всіх заявок.
    // Відкрита сторінка конкурсу цим не страждала (там інший запит).
    for (const r of res.rows as { entry_id: string; counted: number }[]) {
      out.set(String(r.entry_id), Number(r.counted) || 0)
    }
  } catch (err) {
    // Порожня мапа краща за пятисоту помилку: адмінка покаже нулі й
    // лишиться робочою, а причина буде в журналі.
    console.error('[contest-reads]', (err as Error)?.message)
  }
  return out
}

/**
 * Відкрита таблиця: тільки роботи, чиї серії вже вийшли.
 * Помилка тут не має ламати сторінку конкурсів — повертаємо порожній
 * список, блок просто не з'явиться.
 */
export async function publicCountedReads(): Promise<PublicContestRow[]> {
  try {
    const res = await dbQuery(PUBLIC_SQL)
    return (res.rows as PublicContestRow[]).map(r => ({
      entryId:  String(r.entryId),
      contest:  String(r.contest || ''),
      title:    String(r.title || 'Без назви'),
      author:   String(r.author || ''),
      episodes: Number(r.episodes) || 0,
      counted:  Number(r.counted) || 0,
    }))
  } catch (err) {
    console.error('[contest-reads public]', (err as Error)?.message)
    return []
  }
}

/**
 * Перевірка накрутки — для адмінки перед підбиттям підсумків кожного конкурсу.
 *
 * 15.11.2026 (Богдан): на «Око Дракона» за 07–15.11 зайшли дві хвилі свіжих акаунтів,
 * що дочитували тільки цю авторку. У конкурс вони не зараховані — не читали інших
 * авторів. Але умова «читав іншого автора» діє заднім числом: досить такому акаунту
 * дочитати будь-кого ще, і всі його дочитування стануть чинними. Правило свідомо
 * не міняємо (воно в опублікованих умовах і захищає чесних новачків), а перед
 * підсумками дивимося очима.
 *
 * ЩО ПОКАЗУЄ на кожну прийняту роботу:
 *   retro   — зараховані читачі, які вперше дочитали ІНШОГО автора вже ПІСЛЯ цієї
 *             роботи, тобто зараховані лише «заднім числом». Серед них і чесні
 *             новачки, і боти, що «ожили» — тому список, а не автоматичне рішення;
 *   single  — читачі з акаунтом, які дочитали цю роботу, але жодного іншого автора
 *             (зараз не зараховані). Велике число тут — ознака накрутки, що чекає.
 * Нічого не блокує й не змінює.
 */
export type FarmingRow = {
  entryId: string
  contest: string
  title: string
  author: string
  counted: number
  single: number
  retro: { email: string; registered: string; firstRead: string; firstOther: string }[]
}

const FARMING_SQL = `
  ${BASE_CTE},
  firsts as (
    select p.entry_id, p.user_id, p.author_id, min(p.read_date) as first_read
      from pairs p
     group by p.entry_id, p.user_id, p.author_id
  ),
  retro as (
    select f.entry_id, u.email, u.created_at, f.first_read, o.first_other
      from firsts f
      join auth.users u on u.id = f.user_id
      cross join lateral (
        select min(ar2.read_date) as first_other
          from article_reads ar2
          join content c2 on c2.id = ar2.content_id
         where ar2.user_id = f.user_id
           and ar2.completed = true
           and c2.author_id is not null
           and (f.author_id is null or c2.author_id <> f.author_id)
      ) o
     where o.first_other > f.first_read
  ),
  single as (
    select w.entry_id, count(distinct ar.user_id)::int as single
      from works w
      join article_reads ar on ar.content_id = w.content_id and ar.completed = true
      join users u on u.id = ar.user_id
     where (w.author_id is null or ar.user_id <> w.author_id)
       and not exists (
             select 1
               from article_reads ar2
               join content c2 on c2.id = ar2.content_id
              where ar2.user_id = ar.user_id
                and ar2.completed = true
                and c2.author_id is not null
                and (w.author_id is null or c2.author_id <> w.author_id)
           )
     group by w.entry_id
  )
  select e.id::text as entry_id, e.contest, e.title, coalesce(e.author_name, '') as author,
         coalesce(c.counted, 0)::int as counted,
         coalesce(s.single, 0)::int as single,
         coalesce((
           select json_agg(json_build_object(
                    'email', r.email,
                    'registered', to_char(r.created_at at time zone 'Europe/Kyiv', 'DD.MM.YYYY'),
                    'firstRead', to_char(r.first_read, 'DD.MM.YYYY'),
                    'firstOther', to_char(r.first_other, 'DD.MM.YYYY'))
                  order by r.created_at)
             from retro r where r.entry_id = e.id
         ), '[]'::json) as retro
    from contest_entries e
    left join counted c on c.entry_id = e.id
    left join single s on s.entry_id = e.id
   where e.status = 'accepted'
     and (coalesce(s.single, 0) > 0 or exists (select 1 from retro r where r.entry_id = e.id))
   order by coalesce(s.single, 0) desc, e.title
`

export async function farmingCheck(): Promise<FarmingRow[]> {
  const res = await dbQuery(FARMING_SQL)
  return (res.rows as Record<string, unknown>[]).map(r => ({
    entryId: String(r.entry_id),
    contest: String(r.contest || ''),
    title:   String(r.title || 'Без назви'),
    author:  String(r.author || ''),
    counted: Number(r.counted) || 0,
    single:  Number(r.single) || 0,
    retro:   (r.retro as FarmingRow['retro']) || [],
  }))
}
