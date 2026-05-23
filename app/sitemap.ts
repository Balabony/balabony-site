import type { MetadataRoute } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://balabony.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseAdmin()

  // РЎС‚Р°С‚РёС‡РЅС– СЃС‚РѕСЂС–РЅРєРё
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/episodes`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/stories`,  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/gift`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/support`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  // РЎРµСЂС–С— Р‘Р°Р»Р°Р±РѕРЅС–РІ
  const { data: episodes } = await supabase
    .from('content')
    .select('slug, approved_at')
    .eq('type', 'balabony')
    .eq('status', 'published')

  const episodeRoutes: MetadataRoute.Sitemap = (episodes ?? []).map((e: { slug: string; approved_at: string | null }) => ({
    url: `${BASE_URL}/episodes/${e.slug}`,
    lastModified: e.approved_at ? new Date(e.approved_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Р†СЃС‚РѕСЂС–С— С‡РёС‚Р°С‡С–РІ
  const { data: stories } = await supabase
    .from('content')
    .select('slug, approved_at')
    .eq('type', 'story')
    .in('status', ['approved', 'published'])

  const storyRoutes: MetadataRoute.Sitemap = (stories ?? []).map((s: { slug: string; approved_at: string | null }) => ({
    url: `${BASE_URL}/stories/${s.slug}`,
    lastModified: s.approved_at ? new Date(s.approved_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...episodeRoutes, ...storyRoutes]
}