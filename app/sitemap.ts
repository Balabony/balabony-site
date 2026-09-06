import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { authorSlug } from '@/lib/author-slug'
import { REYTYNG_DEMO } from '@/lib/reytyng'
import { GENRES, GENRE_PAGES } from '@/lib/genres'

const BASE_URL = 'https://balabony.com'

/**
 * Файл /sitemap.xml — карта сайту для пошукових систем.
 * Next.js App Router генерує його з цього модуля автоматично.
 *
 * Включає:
 *  - статичні сторінки (фіксований список)
 *  - опубліковані серії «Балабонів» (type='balabony')
 *  - опубліковані серії «Тиші» (type='tysha')
 *  - опубліковані історії (решта типів)
 *  - публічні сторінки авторів /avtor/[slug]
 *
 * /reytyng додається лише коли рейтинг рахує реальні дані. Поки в
 * lib/reytyng.ts стоїть REYTYNG_DEMO = true, сторінка показує умовні
 * прізвища — віддавати таке пошуковику не можна.
 *
 * /contact і /series свідомо відсутні: це permanentRedirect на /contacts
 * і /episodes. Адреса, яка одразу перекидає, у карті сайту зайва —
 * Search Console позначає такі як «Сторінка з переспрямуванням».
 *
 * Сторінки авторів довго не потрапляли сюди взагалі: це десятки адрес з
 * унікальним текстом, про які пошуковик не знав. Slug не зберігається в
 * базі — рахується з імені тією самою функцією, що й на самій сторінці,
 * інакше в карті були б адреси, яких насправді немає.
 *
 * hide_from_directory виключає автора зі списку /avtory, але сама
 * сторінка лишається робочою за прямим посиланням. У карту таких не
 * додаємо: якщо автор просив не показувати його публічно, віддавати
 * адресу пошуковику — те саме показування, тільки іншим шляхом.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 1. Статичні сторінки
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}`,                       lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/stories`,               lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    // Сторінки жанрів. Їх дев'ять і вони незмінні, тому перелічуємо статично:
    // саме через них пошук знаходить розділи на кшталт «смішні історії».
    ...GENRES.map((g) => ({
      url: `${BASE_URL}/stories/zhanr/${GENRE_PAGES[g].slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: `${BASE_URL}/episodes`,              lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/tysha`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/fairytales`,            lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/avtory`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/konkursy`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/support`,               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/games`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/pro-balabony`,          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/vydannya`,              lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/holosy`,                lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/wolne-lektury`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/become-author`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/accessibility`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/inclusivevoice`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/free`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/gift`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/pravopys`,              lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/pravopys/dity`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/demo`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contacts`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE_URL}/survey`,                lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    ...(REYTYNG_DEMO ? [] : [{ url: `${BASE_URL}/reytyng`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 }]),
    { url: `${BASE_URL}/sitemap`,               lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/legal/terms`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/privacy`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/offer`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/cookies`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/refund`,          lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/author-contract`, lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/child-safety`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/games/flash`,           lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/attention`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/maze`,            lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/digits`,          lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/fluency`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/rhythm`,          lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/memory-order`,    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/colors`,          lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/pairs`,           lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/chess`,           lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/checkers`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/domino`,          lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/sudoku`,          lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/narde`,           lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const supabase = getSupabaseAdmin()

  // 2. Твори: серії «Балабонів», серії «Тиші», історії
  let workPages: MetadataRoute.Sitemap = []
  try {
    const { data, error } = await supabase
      .from('content')
      .select('type, slug, approved_at')
      .in('status', ['approved', 'published'])
      .limit(5000)

    if (!error && data) {
      workPages = data
        .filter((row) => row.slug)
        .map((row) => {
          let path: string
          let priority: number

          if (row.type === 'balabony') {
            path = `/episodes/${row.slug}`
            priority = 0.8
          } else if (row.type === 'tysha') {
            path = `/tysha/${row.slug}`
            priority = 0.8
          } else {
            path = `/stories/${row.slug}`
            priority = 0.7
          }

          return {
            url: `${BASE_URL}${path}`,
            lastModified: row.approved_at ? new Date(row.approved_at) : now,
            changeFrequency: 'monthly' as const,
            priority,
          }
        })
    }
  } catch (e) {
    // Якщо Supabase недоступна — віддаємо принаймні статичні сторінки.
    // Не блокуємо генерацію sitemap.
    console.error('Sitemap: failed to fetch content', e)
  }

  // 3. Сторінки авторів. Беремо лише тих, хто має опубліковані твори:
  //    сторінка автора без творів — порожня, і вести на неї пошуковик
  //    немає сенсу.
  let authorPages: MetadataRoute.Sitemap = []
  try {
    const { data: profiles } = await supabase
      .from('author_profiles')
      .select('user_id, display_name, pen_name, hide_from_directory')
      .eq('is_active', true)
      .limit(2000)

    const { data: works } = await supabase
      .from('content')
      .select('author_id')
      .in('status', ['approved', 'published'])
      .limit(5000)

    if (profiles && works) {
      const withWorks = new Set(
        (works as { author_id: string | null }[])
          .map((w) => w.author_id)
          .filter((id): id is string => Boolean(id)),
      )

      const seen = new Set<string>()

      for (const p of profiles as {
        user_id: string
        display_name: string | null
        pen_name: string | null
        hide_from_directory: boolean | null
      }[]) {
        if (p.hide_from_directory) continue
        if (!withWorks.has(p.user_id)) continue

        const name = (p.pen_name?.trim() || p.display_name?.trim() || '')
        if (!name) continue

        const slug = authorSlug(name)
        if (!slug || seen.has(slug)) continue
        seen.add(slug)

        authorPages.push({
          url: `${BASE_URL}/avtor/${slug}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })
      }
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch authors', e)
  }

  return [...staticPages, ...workPages, ...authorPages]
}
