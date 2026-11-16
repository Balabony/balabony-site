import { dbQuery } from '@/lib/db'

/**
 * Дочитування авторів ЗА ВЕСЬ ЧАС — для рейтингів у кабінеті автора й на /avtory.
 *
 * 16.11.2026 (Богдан): раніше рейтинги рахували останні 30 днів (view author_month_stats).
 * Число в кабінеті щодня зменшувалося, коли старі дочитування випадали з вікна, і автори
 * писали «у мене зникають дочитування» (Леонід Данільчик: 17 → 16 → 15). Рішення —
 * число автора ніколи не зменшується: рахуємо за весь час. Щоб новачки теж мали шанс
 * потрапити на дошку, поруч окремий блок newReaderLeaders() — лише імена, без чисел.
 *
 * Правила підрахунку (ті самі, що в конкурсах і порядку озвучення):
 *   - твір за content_id, а не за адресою (slug): зміна назви не обнуляє статистику;
 *   - автор, що дочитує свій твір, собі не зараховується;
 *   - копії, які лишає перенесення історії гостя на акаунт (lib/reader-id.ts,
 *     mergeAnonInto: той самий твір, день і мить дочитування під двома id),
 *     рахуються один раз.
 */

export type AuthorTotals = {
  author_id: string
  reads_completed: number
  reads_total: number
  avg_percentage: number
}

export async function authorReadTotals(): Promise<AuthorTotals[]> {
  const r = await dbQuery(
    `select c.author_id::text as author_id,
            count(distinct (r.content_id, r.read_date, r.read_at)) filter (where r.completed)::int as reads_completed,
            count(*)::int as reads_total,
            coalesce(round(avg(r.read_percentage) filter (where r.completed)), 0)::int as avg_percentage
       from article_reads r
       join content c on c.id::text = r.content_id::text
      where c.author_id is not null
        and r.user_id::text <> c.author_id::text
      group by c.author_id`,
  )
  return (r.rows as Record<string, unknown>[]).map((x) => ({
    author_id: String(x.author_id),
    reads_completed: Number(x.reads_completed) || 0,
    reads_total: Number(x.reads_total) || 0,
    avg_percentage: Number(x.avg_percentage) || 0,
  }))
}

/**
 * Автори, які за останні 30 днів здобули найбільше НОВИХ читачів — людей з акаунтом,
 * що вперше дочитали будь-який їхній твір саме в цей період. Порядок без чисел:
 * блок показує рух, а число, що падає, ображає (див. вище).
 */
export async function newReaderLeaders(limit = 5): Promise<string[]> {
  const r = await dbQuery(
    `with firsts as (
       select c.author_id, r.user_id, min(r.read_date) as first_read
         from article_reads r
         join content c on c.id::text = r.content_id::text
         join users u on u.id = r.user_id
        where r.completed = true
          and c.author_id is not null
          and r.user_id::text <> c.author_id::text
        group by c.author_id, r.user_id
     )
     select author_id::text as author_id, count(*)::int as n
       from firsts
      where first_read >= (now() at time zone 'Europe/Kyiv')::date - 30
      group by author_id
      order by n desc, author_id
      limit $1`,
    [limit * 3],
  )
  return (r.rows as { author_id: string }[]).map((x) => x.author_id)
}
