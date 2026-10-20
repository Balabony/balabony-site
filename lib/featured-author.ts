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

export async function getFeaturedAuthor(slugArg?: string): Promise<FeaturedAuthor | null> {
  try {
    const slug = slugArg || (await currentFeaturedSlug())
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

// ---------------------------------------------------------------------------
// 21.10.2026: вибір автора тижня в адмінці (/admin/avtor-tyzhnia) + нагадування Богдану.
// Таблиця featured_authors створюється сама (RLS увімкнено, політик немає — з публічного API
// її не прочитати; працюємо лише через пряме з'єднання сервера).
// Тиждень — з понеділка за Києвом. Понеділок: лист «оберіть автора тижня» з кандидатами.
// Середа: якщо так і не обрано — сайт ставить першого кандидата сам і повідомляє.
// Кандидати (критерій засновника): багато опублікованих творів, але немає в топ-10 прочитань
// за останні 7 днів; хто вже був автором тижня за пів року — пропускаємо.
// ---------------------------------------------------------------------------
async function ensureTable() {
  await dbQuery(`create table if not exists featured_authors (
    id serial primary key, week_start date not null unique, user_id uuid not null, slug text not null,
    name text, chosen_by text not null default 'admin', chosen_at timestamptz not null default now())`)
  await dbQuery(`alter table featured_authors enable row level security`)
}
export function weekStart(d = new Date()): string {
  const k = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }))
  const dow = (k.getDay() + 6) % 7
  k.setDate(k.getDate() - dow)
  return `${k.getFullYear()}-${String(k.getMonth() + 1).padStart(2, '0')}-${String(k.getDate()).padStart(2, '0')}`
}
export async function currentFeaturedSlug(): Promise<string> {
  try {
    await ensureTable()
    const r = await dbQuery(`select slug from featured_authors where week_start <= $1::date order by week_start desc limit 1`, [weekStart()])
    return (r.rows[0] as { slug?: string } | undefined)?.slug || FEATURED_SLUG
  } catch { return FEATURED_SLUG }
}
export type Candidate = { user_id: string; slug: string; name: string; works: number; reads7: number; avatar: boolean; bio: boolean; last?: string | null }
export async function featuredCandidates(limit = 10): Promise<Candidate[]> {
  await ensureTable()
  const r = await dbQuery(
    `with top as (
       select c.author_id from article_reads r join content c on c.id = r.content_id
        where r.read_date > current_date - 7 and c.author_id is not null
        group by c.author_id order by count(*) desc limit 10),
     reads7 as (
       select c.author_id, count(*)::int as n from article_reads r join content c on c.id = r.content_id
        where r.read_date > current_date - 7 and c.author_id is not null group by c.author_id)
     select p.user_id::text, p.display_name, p.pen_name, (coalesce(p.avatar_url, '') <> '') as avatar,
            (length(coalesce(p.bio, '')) > 40) as bio, count(c.*)::int as works, coalesce(max(r7.n), 0)::int as reads7,
            (select max(week_start)::text from featured_authors f where f.user_id = p.user_id) as last
       from author_profiles p
       join content c on c.author_id = p.user_id and c.status = 'published'
       left join reads7 r7 on r7.author_id = p.user_id
      where coalesce(p.is_active, true) and not coalesce(p.hide_from_directory, false)
        and p.user_id not in (select author_id from top)
      group by p.user_id, p.display_name, p.pen_name, p.avatar_url, p.bio
     having count(c.*) >= 5
      order by works desc
      limit 60`,
  )
  const half = new Date(Date.now() - 182 * 864e5).toISOString().slice(0, 10)
  const rows = (r.rows as { user_id: string; display_name: string | null; pen_name: string | null; avatar: boolean; bio: boolean; works: number; reads7: number; last: string | null }[])
    .map((x) => { const name = realPen(x.pen_name) || x.display_name?.trim() || ''; return { user_id: x.user_id, name, slug: name ? authorSlug(name) : '', works: x.works, reads7: x.reads7, avatar: x.avatar, bio: x.bio, last: x.last } })
    .filter((x) => x.slug && (!x.last || x.last < half))
  // спершу ті, в кого є фото й опис (блок виглядає повноцінно), далі — за кількістю творів
  rows.sort((a, b) => Number(b.avatar && b.bio) - Number(a.avatar && a.bio) || b.works - a.works)
  return rows.slice(0, limit)
}
export async function setFeatured(user_id: string, slug: string, name: string, by: 'admin' | 'auto', week = weekStart()) {
  await ensureTable()
  await dbQuery(
    `insert into featured_authors (week_start, user_id, slug, name, chosen_by) values ($1::date, $2::uuid, $3, $4, $5)
     on conflict (week_start) do update set user_id = excluded.user_id, slug = excluded.slug, name = excluded.name, chosen_by = excluded.chosen_by, chosen_at = now()`,
    [week, user_id, slug, name, by],
  )
}
export async function featuredThisWeek(): Promise<{ slug: string; name: string | null; chosen_by: string } | null> {
  await ensureTable()
  const r = await dbQuery(`select slug, name, chosen_by from featured_authors where week_start = $1::date`, [weekStart()])
  return (r.rows[0] as { slug: string; name: string | null; chosen_by: string } | undefined) ?? null
}
