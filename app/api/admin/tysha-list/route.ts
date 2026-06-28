// app/api/admin/tysha-list/route.ts
// Список серій «Тиші» (type='tysha') для редактора /admin/tysha.
// Збагачено: статус, мітка аудіо, лічильник порушень канону (серверно через checkTysha).
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { checkTysha } from '@/lib/canon/tysha'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

type Row = {
  id: string
  slug: string
  title: string
  season_number: number | null
  episode_number: number | null
  status: string
  audio_status: string | null
  audio_url: string | null
  text: string | null
  corrected_text: string | null
  cover_url: string | null
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('content')
      .select('id, slug, title, season_number, episode_number, status, audio_status, audio_url, text, corrected_text, cover_url')
      .eq('type', 'tysha')
      .order('season_number', { ascending: true })
      .order('episode_number', { ascending: true })

    if (error) throw error

    const items = ((data ?? []) as Row[]).map((r) => {
      const body = (r.corrected_text?.trim() ? r.corrected_text : r.text) ?? ''
      const findings = body ? checkTysha(body) : []
      const canonErrors = findings.filter((f) => f.severity === 'error').length
      const canonWarns = findings.filter((f) => f.severity === 'warn').length
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        season_number: r.season_number,
        episode_number: r.episode_number,
        status: r.status,
        audioStatus: r.audio_status ?? null,
        hasAudio: !!(r.audio_url && String(r.audio_url).trim()),
        canonErrors,
        canonWarns,
        coverUrl: r.cover_url ?? null,
      }
    })

    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
