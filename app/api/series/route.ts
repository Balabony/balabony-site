import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// Якщо тривалість не задана в базі — рахуємо орієнтовний час читання з тексту (~150 слів/хв).
function estimateMinutes(text?: string | null): number | undefined {
  if (!text) return undefined
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return words ? Math.max(1, Math.round(words / 150)) : undefined
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const orderParam = (searchParams.get('order') ?? 'asc').toLowerCase()
    const ascending = orderParam !== 'desc'

    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || 0)) : null

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('content')
      .select('slug, episode_number, season_number, title, cover_url, audio_status, description, short_script, duration_minutes, text, hook, next_teaser, next_release_date')
      .eq('type', 'balabony')
      .eq('status', 'published')
      .order('season_number', { ascending })
      .order('episode_number', { ascending })

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) throw error

    const mapped = (data ?? []).map(r => ({
      id: r.slug,
      number: r.episode_number,
      season: r.season_number,
      title: r.title,
      cover_url: r.cover_url,
      has_audio: r.audio_status === 'ready',
      url: `/episodes/${r.slug}`,
      description: r.description,
      duration_minutes: r.duration_minutes ?? estimateMinutes(r.text),
      // Зачин для картки: НЕ-спойлерний гачок. Для Балабонів description = переказ (спойлер),
      // тому в тизер його НЕ пускаємо: short_script → hook, і все.
      teaser: r.hook ?? r.short_script ?? null,
      hook: r.hook ?? null,
      next_teaser: r.next_teaser ?? null,
      next_release_date: r.next_release_date ?? null,
    }))

    return NextResponse.json(mapped)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}