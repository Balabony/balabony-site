import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const BASE_URL = 'https://balabony.com'

/**
 * Р В Р’В¤Р В Р’В°Р В РІвЂћвЂ“Р В Р’В» /sitemap.xml Р Р†Р вЂљРІР‚Сњ Р В РЎвЂќР В Р’В°Р РЋР вЂљР РЋРІР‚С™Р В Р’В° Р РЋР С“Р В Р’В°Р В РІвЂћвЂ“Р РЋРІР‚С™Р РЋРЎвЂњ Р В РўвЂР В Р’В»Р РЋР РЏ Р В РЎвЂ”Р В РЎвЂўР РЋРІвЂљВ¬Р РЋРЎвЂњР В РЎвЂќР В РЎвЂўР В Р вЂ Р В РЎвЂР В РЎвЂќР РЋРІР‚вЂњР В Р вЂ .
 * Next.js App Router Р В РЎвЂ“Р В Р’ВµР В Р вЂ¦Р В Р’ВµР РЋР вЂљР РЋРЎвЂњР РЋРІР‚Сњ Р В РІвЂћвЂ“Р В РЎвЂўР В РЎвЂ“Р В РЎвЂў Р В Р’В· Р РЋРІР‚В Р РЋР Р‰Р В РЎвЂўР В РЎвЂ“Р В РЎвЂў Р В РЎВР В РЎвЂўР В РўвЂР РЋРЎвЂњР В Р’В»Р РЋР РЏ Р В Р’В°Р В Р вЂ Р РЋРІР‚С™Р В РЎвЂўР В РЎВР В Р’В°Р РЋРІР‚С™Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р В РЎвЂў.
 *
 * Р В РІР‚в„ўР В РЎвЂќР В Р’В»Р РЋР вЂ№Р РЋРІР‚РЋР В Р’В°Р РЋРІР‚Сњ:
 *  - Р РЋР С“Р РЋРІР‚С™Р В Р’В°Р РЋРІР‚С™Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р РЋРІР‚вЂњ Р РЋР С“Р РЋРІР‚С™Р В РЎвЂўР РЋР вЂљР РЋРІР‚вЂњР В Р вЂ¦Р В РЎвЂќР В РЎвЂ (Р РЋРІР‚С›Р РЋРІР‚вЂњР В РЎвЂќР РЋР С“Р В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦Р В РЎвЂР В РІвЂћвЂ“ Р РЋР С“Р В РЎвЂ”Р В РЎвЂР РЋР С“Р В РЎвЂўР В РЎвЂќ)
 *  - Р РЋРЎвЂњР РЋР С“Р РЋРІР‚вЂњ Р В РЎвЂўР В РЎвЂ”Р РЋРЎвЂњР В Р’В±Р В Р’В»Р РЋРІР‚вЂњР В РЎвЂќР В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦Р РЋРІР‚вЂњ Р РЋР С“Р В Р’ВµР РЋР вЂљР РЋРІР‚вЂњР РЋРІР‚вЂќ Р В Р’В· Supabase (type='balabony')
 *  - Р РЋРЎвЂњР РЋР С“Р РЋРІР‚вЂњ Р В РЎвЂўР В РЎвЂ”Р РЋРЎвЂњР В Р’В±Р В Р’В»Р РЋРІР‚вЂњР В РЎвЂќР В РЎвЂўР В Р вЂ Р В Р’В°Р В Р вЂ¦Р РЋРІР‚вЂњ Р РЋРІР‚вЂњР РЋР С“Р РЋРІР‚С™Р В РЎвЂўР РЋР вЂљР РЋРІР‚вЂњР РЋРІР‚вЂќ Р В Р’В· Supabase (type='story')
 *
 * Р В РЎв„ўР В РЎвЂўР В Р’В¶Р В Р’ВµР В Р вЂ¦ Р В Р’В·Р В Р’В°Р В РЎвЂ”Р В РЎвЂР РЋР С“ Р В РЎВР В Р’В°Р РЋРІР‚Сњ priority (Р В Р вЂ Р В Р’В°Р В Р’В¶Р В Р’В»Р В РЎвЂР В Р вЂ Р РЋРІР‚вЂњР РЋР С“Р РЋРІР‚С™Р РЋР Р‰ 0-1) Р РЋРІР‚вЂњ changeFrequency (Р РЋРІР‚РЋР В Р’В°Р РЋР С“Р РЋРІР‚С™Р В РЎвЂўР РЋРІР‚С™Р В Р’В° Р В РЎвЂўР В Р вЂ¦Р В РЎвЂўР В Р вЂ Р В Р’В»Р В Р’ВµР В Р вЂ¦Р РЋР Р‰).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 1. Р В Р Р‹Р РЋРІР‚С™Р В Р’В°Р РЋРІР‚С™Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р РЋРІР‚вЂњ Р РЋР С“Р РЋРІР‚С™Р В РЎвЂўР РЋР вЂљР РЋРІР‚вЂњР В Р вЂ¦Р В РЎвЂќР В РЎвЂ
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
    { url: `${BASE_URL}/games/maze`,          lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/digits`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/fluency`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/rhythm`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/memory-order`,  lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/colors`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/pairs`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/chess`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/checkers`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/domino`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/games/sudoku`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  // 2. Р В РІР‚СњР В РЎвЂР В Р вЂ¦Р В Р’В°Р В РЎВР РЋРІР‚вЂњР РЋРІР‚РЋР В Р вЂ¦Р РЋРІР‚вЂњ: Р РЋР С“Р В Р’ВµР РЋР вЂљР РЋРІР‚вЂњР РЋРІР‚вЂќ Р РЋРІР‚С™Р В Р’В° Р РЋРІР‚вЂњР РЋР С“Р РЋРІР‚С™Р В РЎвЂўР РЋР вЂљР РЋРІР‚вЂњР РЋРІР‚вЂќ Р В Р’В· Supabase
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
    // Р В Р вЂЎР В РЎвЂќР РЋРІР‚В°Р В РЎвЂў Supabase Р В Р вЂ¦Р В Р’ВµР В РўвЂР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р РЋРЎвЂњР В РЎвЂ”Р В Р вЂ¦Р В Р’В° Р Р†Р вЂљРІР‚Сњ Р В РЎвЂ”Р РЋР вЂљР В РЎвЂўР РЋР С“Р РЋРІР‚С™Р В РЎвЂў Р В РЎвЂ”Р В РЎвЂўР В Р вЂ Р В Р’ВµР РЋР вЂљР РЋРІР‚С™Р В Р’В°Р РЋРІР‚СњР В РЎВР В РЎвЂў Р РЋР С“Р РЋРІР‚С™Р В Р’В°Р РЋРІР‚С™Р В РЎвЂР РЋРІР‚РЋР В Р вЂ¦Р РЋРІР‚вЂњ Р РЋР С“Р РЋРІР‚С™Р В РЎвЂўР РЋР вЂљР РЋРІР‚вЂњР В Р вЂ¦Р В РЎвЂќР В РЎвЂ.
    // Р В РЎСљР В Р’Вµ Р В Р’В±Р В Р’В»Р В РЎвЂўР В РЎвЂќР РЋРЎвЂњР РЋРІР‚СњР В РЎВР В РЎвЂў Р В РЎвЂ“Р В Р’ВµР В Р вЂ¦Р В Р’ВµР РЋР вЂљР В Р’В°Р РЋРІР‚В Р РЋРІР‚вЂњР РЋР вЂ№ sitemap.
    console.error('Sitemap: failed to fetch dynamic pages from Supabase', e)
  }

  return [...staticPages, ...dynamicPages]
}
