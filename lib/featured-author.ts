import { dbQuery } from '@/lib/db'
import { authorSlug } from '@/lib/author-slug'
import { realPen } from '@/lib/pen-name'

/**
 * «Знайомтеся: автор тижня» на головній (21.10.2026).
 *
 * Навіщо: рейтинг показує лише лідерів прочитань і новачків, тож сильні автори з багатьма творами
 * лишаються непоміченими. Перший автор — Тетяна Комар (рішення засновника). Далі — черга: автори
 * з багатьма творами, які не потрапляють у рейтинг (буде окремо, з вибором в адмінці).
 * Щоб змінити автора тижня зараз — замініть FEATURED_SLUG (адреса сторінки автора /avtor/<slug>).
 */
export const FEATURED_SLUG = 'tetiana-komar'

export type FeaturedWork = { slug: string; type: string; title: string; cover_url: string | null }
export type FeaturedAuthor = { slug: string; name: string; bio: string; avatar: string | null; total: number; works: FeaturedWork[] }

export async function getFeaturedAuthor(slug = FEATURED_SLUG): Promise<FeaturedAuthor | null> {
  try {
    const p = await dbQuery(
      `select user_id::text, display_name, pen_name, bio, avatar_url from author_profiles
        where coalesce(is_active, true) = true and coalesce(hide_from_directory, false) = false`,
    )
    const prof = (p.rows as { user_id: string; display_name: string | null; pen_name: string | null; bio: string | null; avatar_url: string | null }[])
      .find((x) => { const n = realPen(x.pen_name) || x.display_name?.trim() || ''; return n !== '' && authorSlug(n) === slug })
    if (!prof) return null
    const name = realPen(prof.pen_name) || prof.display_name!.trim()
    // Твори: спершу ті, що найчастіше дочитують; за рівності — свіжіші й з обкладинкою.
    const w = await dbQuery(
      `select c.slug, c.type::text as type, c.title, c.cover_url,
              count(r.*) filter (where r.completed = true)::int as finished
         from content c
         left join article_reads r on r.content_id = c.id
        where c.author_id = $1 and c.slug is not null and c.status = 'published'
          and c.type::text = 'story' and coalesce(c.is_adult, false) = false
        group by c.id
        order by finished desc, (coalesce(c.cover_url, '') <> '') desc, coalesce(c.approved_at, c.created_at) desc
        limit 4`,
      [prof.user_id],
    )
    const t = await dbQuery(`select count(*)::int as n from content where author_id = $1 and status = 'published'`, [prof.user_id])
    const bio = (prof.bio ?? '').trim()
    return {
      slug, name, avatar: prof.avatar_url, total: (t.rows[0] as { n: number })?.n ?? 0,
      bio: bio.length > 320 ? bio.slice(0, bio.lastIndexOf(' ', 320)) + '…' : bio,
      works: w.rows as FeaturedWork[],
    }
  } catch (e) {
    console.error('getFeaturedAuthor failed', (e as Error)?.message)
    return null
  }
}
