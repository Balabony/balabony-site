import { dbQuery } from '@/lib/db'

/**
 * Твори, які найбільше дочитують (24.09.2026).
 *
 * Навіщо окремий модуль: той самий список потрібен у двох місцях —
 * блок «Найбільше дочитують» на головній і окрема карта сайту
 * /sitemap-top.xml. Обидва служать одній меті: показати Google, які
 * сторінки в нас найважливіші. На 24.09.2026 з ~1 100 сторінок у
 * пошуку близько 400, решта «Виявлено, наразі не проіндексовано» —
 * Google знає адреси, але не вважає їх вартими сканування. Посилання з
 * головної (її Google обходить найчастіше) і окрема карта — два
 * найсильніші сигнали, які ми можемо дати самі.
 *
 * Дані — article_reads, те саме джерело, що /admin/dochytuvannia і /top:
 *   finished — completed (70% обсягу + мінімум часу, правило договору);
 *   readers  — скільки разів твір відкривали.
 * Сортування: спершу дочитування, потім відкриття.
 *
 * Видимість повторює правило карти сайту: історії — approved/published,
 * «Балабони» й «Тиша» — лише published (запланована «Тиша» сюди не
 * потрапляє: краще пропустити сторінку, ніж вести Google на 404).
 */

export type FinishedItem = {
  slug: string
  title: string
  author_name: string | null
  type: string | null
  stamp: string | null
  finished: number
  readers: number
}

export async function getMostFinished(
  limit: number,
  opts: { storiesOnly?: boolean } = {},
): Promise<FinishedItem[]> {
  try {
    const res = await dbQuery(
      `select c.slug, c.title, c.author_name, c.type::text as type,
              coalesce(c.approved_at, c.created_at) as stamp,
              count(*) filter (where r.completed = true)::int as finished,
              count(*)::int as readers
         from article_reads r
         join content c on c.id = r.content_id
        where c.slug is not null
          and (c.status = 'published'
               or (c.status = 'approved' and c.type::text not in ('balabony', 'tysha')))
          ${opts.storiesOnly ? "and c.type::text = 'story'" : ''}
        group by c.slug, c.title, c.author_name, c.type, c.approved_at, c.created_at
        order by finished desc, readers desc
        limit $1`,
      [limit],
    )
    return res.rows as FinishedItem[]
  } catch (e) {
    console.error('getMostFinished failed', e)
    return []
  }
}
