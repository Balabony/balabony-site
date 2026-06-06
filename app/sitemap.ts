import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const BASE_URL = 'https://balabony.com'

/**
 * Р¤Р°Р№Р» /sitemap.xml вЂ” РєР°СЂС‚Р° СЃР°Р№С‚Сѓ РґР»СЏ РїРѕС€СѓРєРѕРІРёРєС–РІ.
 * Next.js App Router РіРµРЅРµСЂСѓС” Р№РѕРіРѕ Р· С†СЊРѕРіРѕ РјРѕРґСѓР»СЏ Р°РІС‚РѕРјР°С‚РёС‡РЅРѕ.
 *
 * Р’РєР»СЋС‡Р°С”:
 *  - СЃС‚Р°С‚РёС‡РЅС– СЃС‚РѕСЂС–РЅРєРё (С„С–РєСЃРѕРІР°РЅРёР№ СЃРїРёСЃРѕРє)
 *  - СѓСЃС– РѕРїСѓР±Р»С–РєРѕРІР°РЅС– СЃРµСЂС–С— Р· Supabase (type='balabony')
 *  - СѓСЃС– РѕРїСѓР±Р»С–РєРѕРІР°РЅС– С–СЃС‚РѕСЂС–С— Р· Supabase (type='story')
 *
 * РљРѕР¶РµРЅ Р·Р°РїРёСЃ РјР°С” priority (РІР°Р¶Р»РёРІС–СЃС‚СЊ 0-1) С– changeFrequency (С‡Р°СЃС‚РѕС‚Р° РѕРЅРѕРІР»РµРЅСЊ).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 1. РЎС‚Р°С‚РёС‡РЅС– СЃС‚РѕСЂС–РЅРєРё
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
    { url: `${BASE_URL}/games`,               lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/games/flash`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/attention`,     lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/memory-order`,  lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/colors`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/pairs`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  // 2. Р”РёРЅР°РјС–С‡РЅС–: СЃРµСЂС–С— С‚Р° С–СЃС‚РѕСЂС–С— Р· Supabase
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
    // РЇРєС‰Рѕ Supabase РЅРµРґРѕСЃС‚СѓРїРЅР° вЂ” РїСЂРѕСЃС‚Рѕ РїРѕРІРµСЂС‚Р°С”РјРѕ СЃС‚Р°С‚РёС‡РЅС– СЃС‚РѕСЂС–РЅРєРё.
    // РќРµ Р±Р»РѕРєСѓС”РјРѕ РіРµРЅРµСЂР°С†С–СЋ sitemap.
    console.error('Sitemap: failed to fetch dynamic pages from Supabase', e)
  }

  return [...staticPages, ...dynamicPages]
}
