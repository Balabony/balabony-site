import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const BASE_URL = 'https://balabony.com'

/**
 * Р В¤Р В°Р в„–Р В» /sitemap.xml РІР‚вЂќ Р С”Р В°РЎР‚РЎвЂљР В° РЎРѓР В°Р в„–РЎвЂљРЎС“ Р Т‘Р В»РЎРЏ Р С—Р С•РЎв‚¬РЎС“Р С”Р С•Р Р†Р С‘Р С”РЎвЂ“Р Р†.
 * Next.js App Router Р С–Р ВµР Р…Р ВµРЎР‚РЎС“РЎвЂќ Р в„–Р С•Р С–Р С• Р В· РЎвЂ РЎРЉР С•Р С–Р С• Р СР С•Р Т‘РЎС“Р В»РЎРЏ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР Р…Р С•.
 *
 * Р вЂ™Р С”Р В»РЎР‹РЎвЂЎР В°РЎвЂќ:
 *  - РЎРѓРЎвЂљР В°РЎвЂљР С‘РЎвЂЎР Р…РЎвЂ“ РЎРѓРЎвЂљР С•РЎР‚РЎвЂ“Р Р…Р С”Р С‘ (РЎвЂћРЎвЂ“Р С”РЎРѓР С•Р Р†Р В°Р Р…Р С‘Р в„– РЎРѓР С—Р С‘РЎРѓР С•Р С”)
 *  - РЎС“РЎРѓРЎвЂ“ Р С•Р С—РЎС“Р В±Р В»РЎвЂ“Р С”Р С•Р Р†Р В°Р Р…РЎвЂ“ РЎРѓР ВµРЎР‚РЎвЂ“РЎвЂ” Р В· Supabase (type='balabony')
 *  - РЎС“РЎРѓРЎвЂ“ Р С•Р С—РЎС“Р В±Р В»РЎвЂ“Р С”Р С•Р Р†Р В°Р Р…РЎвЂ“ РЎвЂ“РЎРѓРЎвЂљР С•РЎР‚РЎвЂ“РЎвЂ” Р В· Supabase (type='story')
 *
 * Р С™Р С•Р В¶Р ВµР Р… Р В·Р В°Р С—Р С‘РЎРѓ Р СР В°РЎвЂќ priority (Р Р†Р В°Р В¶Р В»Р С‘Р Р†РЎвЂ“РЎРѓРЎвЂљРЎРЉ 0-1) РЎвЂ“ changeFrequency (РЎвЂЎР В°РЎРѓРЎвЂљР С•РЎвЂљР В° Р С•Р Р…Р С•Р Р†Р В»Р ВµР Р…РЎРЉ).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 1. Р РЋРЎвЂљР В°РЎвЂљР С‘РЎвЂЎР Р…РЎвЂ“ РЎРѓРЎвЂљР С•РЎР‚РЎвЂ“Р Р…Р С”Р С‘
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
    { url: `${BASE_URL}/games/flash`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/attention`,     lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/memory-order`,  lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/colors`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/pairs`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  // 2. Р вЂќР С‘Р Р…Р В°Р СРЎвЂ“РЎвЂЎР Р…РЎвЂ“: РЎРѓР ВµРЎР‚РЎвЂ“РЎвЂ” РЎвЂљР В° РЎвЂ“РЎРѓРЎвЂљР С•РЎР‚РЎвЂ“РЎвЂ” Р В· Supabase
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
    // Р Р‡Р С”РЎвЂ°Р С• Supabase Р Р…Р ВµР Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р Р…Р В° РІР‚вЂќ Р С—РЎР‚Р С•РЎРѓРЎвЂљР С• Р С—Р С•Р Р†Р ВµРЎР‚РЎвЂљР В°РЎвЂќР СР С• РЎРѓРЎвЂљР В°РЎвЂљР С‘РЎвЂЎР Р…РЎвЂ“ РЎРѓРЎвЂљР С•РЎР‚РЎвЂ“Р Р…Р С”Р С‘.
    // Р СњР Вµ Р В±Р В»Р С•Р С”РЎС“РЎвЂќР СР С• Р С–Р ВµР Р…Р ВµРЎР‚Р В°РЎвЂ РЎвЂ“РЎР‹ sitemap.
    console.error('Sitemap: failed to fetch dynamic pages from Supabase', e)
  }

  return [...staticPages, ...dynamicPages]
}
