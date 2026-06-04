import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const BASE_URL = 'https://balabony.com'

/**
 * Файл /sitemap.xml — карта сайту для пошуковиків.
 * Next.js App Router генерує його з цього модуля автоматично.
 *
 * Включає:
 *  - статичні сторінки (фіксований список)
 *  - усі опубліковані серії з Supabase (type='balabony')
 *  - усі опубліковані історії з Supabase (type='story')
 *
 * Кожен запис має priority (важливість 0-1) і changeFrequency (частота оновлень).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 1. Статичні сторінки
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}`,                       lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/stories`,               lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/episodes`,              lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/about`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/games`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/support`,               lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/become-author`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/accessibility`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/inclusivevoice`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contacts`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE_URL}/sitemap`,               lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/legal/terms`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/privacy`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/offer`,           lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/cookies`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/refund`,          lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/author-contract`, lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/legal/child-safety`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // 2. Динамічні: серії та історії з Supabase
  let dynamicPages: MetadataRoute.Sitemap = []
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('content')
      .select('type, slug, approved_at')
      .in('status', ['approved', 'published'])
    if (!error && data) {
      dynamicPages = data
        .filter(row => row.slug)
        .map(row => {
          const isEpisode = row.type === 'balabony'
          const path = isEpisode ? `/episodes/${row.slug}` : `/stories/${row.slug}`
          const lastModified = row.approved_at ? new Date(row.approved_at) : now
          return {
            url:             `${BASE_URL}${path}`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority:        isEpisode ? 0.8 : 0.7,
          }
        })
    }
  } catch (e) {
    // Якщо Supabase недоступна — просто повертаємо статичні сторінки.
    // Не блокуємо генерацію sitemap.
    console.error('Sitemap: failed to fetch dynamic pages from Supabase', e)
  }

  return [...staticPages, ...dynamicPages]
}
