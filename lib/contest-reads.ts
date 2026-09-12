import { dbQuery } from '@/lib/db'

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
 *   content         — хто автор твору (author_id).
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

const SQL = `
  with works as (
    select ep.id        as episode_id,
           ep.entry_id  as entry_id,
           ep.content_id,
           c.author_id
      from contest_episodes ep
      join content c on c.id = ep.content_id
     where ep.content_id is not null
  )
  select w.entry_id::text                                              as entry_id,
         count(distinct ar.user_id::text || ':' || w.episode_id::text)::int as counted
    from works w
    join article_reads ar
      on ar.content_id = w.content_id
     and ar.completed = true
    join users u
      on u.id = ar.user_id
   where (w.author_id is null or ar.user_id <> w.author_id)
     and exists (
           select 1
             from article_reads ar2
             join content c2 on c2.id = ar2.content_id
            where ar2.user_id = ar.user_id
              and ar2.completed = true
              and c2.author_id is not null
              and (w.author_id is null or c2.author_id <> w.author_id)
         )
   group by w.entry_id
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
    for (const r of res.rows as ContestCount[]) {
      out.set(String(r.entryId), Number(r.counted) || 0)
    }
  } catch (err) {
    // Порожня мапа краща за пятисоту помилку: адмінка покаже нулі й
    // лишиться робочою, а причина буде в журналі.
    console.error('[contest-reads]', (err as Error)?.message)
  }
  return out
}
