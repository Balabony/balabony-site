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
 * Обкладинки творів віддаються полем images — Next перетворює його на
 * <image:image> у XML. До 10.09.2026 карта не містила жодного зображення.
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
// Без цього рядка Next збирає карту під час білда, і новий твір потрапляє
// в неї лише з наступним деплоєм. Година — компроміс між свіжістю і
// навантаженням на базу.
export const revalidate = 3600

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
    { url: `${BASE_URL}/top`,                   lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/avtory`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/konkursy`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    // Подача творів. Окрема адреса, бо автор шукає її пошуком («як подати твір
    // на конкурс»), а не лише переходом зі сторінки конкурсів.
    { url: `${BASE_URL}/konkursy/podaty`,       lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/support`,               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/games`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/pro-balabony`,          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // Послуги з розробки сайтів. У головному меню сторінки свідомо немає —
    // на неї ведуть оголошення і пошук, тож у карті сайту вона потрібна.
    { url: `${BASE_URL}/poslugy`,               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/vydannya`,              lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // Черга на озвучення: голосування читачів. Окрема адреса, бо це те, що
    // люди пересилатимуть одне одному («проголосуй за мою історію»).
    { url: `${BASE_URL}/cherga`,                lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE_URL}/holosy`,                lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/wolne-lektury`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/become-author`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/accessibility`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Як поставити сайт на екран телефона. Окрема адреса, бо це інформаційний
    // запит («як встановити застосунок»), на який відповідає підвал.
    { url: `${BASE_URL}/vstanovyty`,            lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/inclusivevoice`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/free`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/gift`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // Календарі. /kalendar — продаж друкованого А3, /kalendar-2027 — безкоштовні
    // макети А4. Розведені за наміром пошуку, тому обидві в карті.
    { url: `${BASE_URL}/bonusy`,                lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/kalendar`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/kalendar-2027`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/kalendar-2027/na-odnomu-arkushi`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/kalendar-2027/dytiachyi`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
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
    { url: `${BASE_URL}/games/chess`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/checkers`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/domino`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/sudoku`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/narde`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const supabase = getSupabaseAdmin()

  // 2. Твори: серії «Балабонів», серії «Тиші», історії
  let workPages: MetadataRoute.Sitemap = []
  try {
    const { data, error } = await supabase
      .from('content')
      .select('type, slug, approved_at, created_at, cover_url, status, publish_at')
      .in('status', ['approved', 'published', 'scheduled'])
      .limit(5000)

    if (!error && data) {
      // Кожен тип має власне правило видимості, і карта мусить його
      // повторювати рівно. Інакше або ведемо пошуковик на 404 (сторінка
      // статус не віддає), або ховаємо робочі сторінки.
      //   історії      — approved і published (PUBLIC_STATUSES у /stories/[id]);
      //   «Балабони»   — лише published;
      //   «Тиша»       — published або scheduled, у якої publish_at уже настав.
      const visible = (row: { type: string | null; status: string | null; publish_at: string | null }) => {
        if (row.status === 'published') return true
        if (row.type === 'balabony') return false
        if (row.type === 'tysha') {
          return row.status === 'scheduled' && !!row.publish_at && new Date(row.publish_at) <= now
        }
        return row.status === 'approved'
      }

      workPages = data
        .filter((row) => row.slug)
        .filter(visible)
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

          // Дата зміни: тільки справжня. Раніше при порожньому approved_at
          // підставлявся момент генерації — і карта щоразу заявляла, що всі
          // сотні сторінок щойно змінилися. Пошуковик на таке перестає
          // зважати взагалі, тож краще не давати дати, ніж давати фальшиву.
          const stamp = row.approved_at ?? row.created_at ?? null

          return {
            url: `${BASE_URL}${path}`,
            ...(stamp ? { lastModified: new Date(stamp) } : {}),
            changeFrequency: 'monthly' as const,
            priority,
            // Обкладинки: без цього Google не знає про них жодної.
            ...(row.cover_url ? { images: [row.cover_url] } : {}),
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

    // Автори БЕЗ заведеного профілю: їхні твори записані лише за іменем,
    // author_id порожній. Сторінка /avtor/[slug] для них працює — вона
    // шукає за author_name — але в карту сайту вони не потрапляли, і Google
    // про сімдесят робочих сторінок просто не знав.
    const { data: plainWorks } = await supabase
      .from('content')
      .select('author_name')
      .is('author_id', null)
      .not('author_name', 'is', null)
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

      for (const w of (plainWorks ?? []) as { author_name: string | null }[]) {
        const name = (w.author_name ?? '').trim()
        if (!name) continue

        const slug = authorSlug(name)
        if (!slug || seen.has(slug)) continue
        seen.add(slug)

        authorPages.push({
          url: `${BASE_URL}/avtor/${slug}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        })
      }
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch authors', e)
  }

  return [...staticPages, ...workPages, ...authorPages]
}
