// app/api/tysha/route.ts
// Публічний список серій «Тиші» для рубрики «Авторські серіали».
// Фільтр-за-часом: показуємо published АБО scheduled, у яких час уже настав
// (так планувальник публікує серію точно в заданий момент навіть на Hobby-плані).
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function estimateMinutes(text?: string | null): number | undefined {
  if (!text) return undefined
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return words ? Math.max(1, Math.round(words / 150)) : undefined
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(200, parseInt(limitParam, 10) || 0)) : null

    const nowIso = new Date().toISOString()
    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('content')
      .select('slug, episode_number, season_number, title, cover_url, audio_status, description, short_description, duration_minutes, text, hook, next_teaser')
      .eq('type', 'tysha')
      .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${nowIso})`)
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true })

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) throw error

    const mapped = (data ?? []).map((r) => ({
      id: r.slug,
      number: r.episode_number,
      season: r.season_number,
      title: r.title,
      cover_url: r.cover_url,
      has_audio: r.audio_status === 'ready',
      url: `/tysha/${r.slug}`,
      description: r.hook ?? r.short_description ?? r.description ?? null,
      duration_minutes: r.duration_minutes ?? estimateMinutes(r.text),
      next_teaser: r.next_teaser ?? null,
    }))

    return NextResponse.json(mapped)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
